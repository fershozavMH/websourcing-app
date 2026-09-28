import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebase-admin';
import { requireMonitoreoAdmin } from '@/lib/monitoreo/auth';
import { SYSTEM_LOGS_COLLECTION } from '@/constants/monitoreo';
import { FIREBASE_COLLECTION, PORTAFOLIO_COLLECTION, SUBASTAS_COLLECTION } from '@/constants/appConfig';
import { LOG_CODES } from '@/constants/logCodes';

const DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;
const PRODUCTIVITY_WEEKS = 6;
const UPCOMING_AUCTION_DAYS = 3;

// Lunes de la semana ISO a la que pertenece `d`, como clave "YYYY-MM-DD".
function isoWeekStart(d: Date): string {
  const copy = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() - day + 1);
  return copy.toISOString().slice(0, 10);
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

function toDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

async function lastTimestamp(collection: string, field: string): Promise<string | null> {
  const snap = await getFirestore().collection(collection).orderBy(field, 'desc').limit(1).get();
  if (snap.empty) return null;
  return toDate(snap.docs[0].data()[field])?.toISOString() ?? null;
}

// Clasificación gruesa del user agent — solo para agrupar, no para detección
// precisa de versión. El orden importa: Edge/Opera incluyen "Chrome" en su UA.
function browserFromUserAgent(ua: string | null | undefined): string {
  if (!ua) return 'Desconocido';
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\//.test(ua)) return 'Opera';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  return 'Otro';
}

export async function GET(request: Request) {
  const guard = await requireMonitoreoAdmin(request);
  if (!guard.ok) return guard.response;

  const db = getFirestore();
  const since = new Date(Date.now() - DAYS * DAY_MS);
  const errors: string[] = [];

  // Las consultas de logs usan el índice category+timestamp que ya requiere
  // /api/monitoreo/activity; el filtrado por código se hace en memoria.
  const logsFor = (category: 'error' | 'security') =>
    db
      .collection(SYSTEM_LOGS_COLLECTION)
      .where('category', '==', category)
      .where('timestamp', '>=', since)
      .orderBy('timestamp', 'desc')
      .limit(2000)
      .get();

  const sinceProductivity = new Date(Date.now() - PRODUCTIVITY_WEEKS * 7 * DAY_MS).toISOString();
  const now = new Date();
  const upcomingLimit = new Date(now.getTime() + UPCOMING_AUCTION_DAYS * DAY_MS);

  const logsCol = db.collection(SYSTEM_LOGS_COLLECTION);
  const [
    errorLogs,
    securityLogs,
    erpSent,
    mvpSent,
    lastMachine,
    lastAuction,
    logCount,
    oldestLog,
    erpProductivity,
    mvpProductivity,
    upcomingAuctions,
    machinesCount,
    portafolioCount,
    subastasCount,
  ] = await Promise.allSettled([
    logsFor('error'),
    logsFor('security'),
    db.collection(FIREBASE_COLLECTION).where('fecha_envio_erp', '>=', since.toISOString()).get(),
    db.collection(FIREBASE_COLLECTION).where('fecha_envio_mvp', '>=', since.toISOString()).get(),
    lastTimestamp(FIREBASE_COLLECTION, 'timestamp'),
    lastTimestamp(SUBASTAS_COLLECTION, 'scraped_at'),
    logsCol.count().get(),
    logsCol.orderBy('timestamp', 'asc').limit(1).get(),
    db.collection(FIREBASE_COLLECTION).where('fecha_envio_erp', '>=', sinceProductivity).get(),
    db.collection(FIREBASE_COLLECTION).where('fecha_envio_mvp', '>=', sinceProductivity).get(),
    // Sin filtro de fecha en la consulta: `fecha_subasta` puede venir como
    // Timestamp o como string según lo que haya escrito el scraper, y
    // Firestore no compara rangos entre tipos distintos. Se filtra en memoria.
    db.collection(SUBASTAS_COLLECTION).where('estado', '!=', 'cerrada').limit(2000).get(),
    db.collection(FIREBASE_COLLECTION).count().get(),
    db.collection(PORTAFOLIO_COLLECTION).count().get(),
    db.collection(SUBASTAS_COLLECTION).count().get(),
  ]);

  const days: string[] = [];
  for (let i = DAYS - 1; i >= 0; i--) days.push(dayKey(new Date(Date.now() - i * DAY_MS)));
  const blank = () => Object.fromEntries(days.map((d) => [d, 0])) as Record<string, number>;

  // ── Envíos ERP / MVP ──────────────────────────────────────────────────────
  const erpOk = blank();
  const mvpOk = blank();
  const erpFail = blank();
  const mvpFail = blank();
  const errorsByCode = new Map<string, number>();
  let credentialFallbacks = 0;
  const credentialMissing = new Map<string, { count: number; last: number }>();
  const browserCounts = new Map<string, number>();
  const imageErrorsBySource = new Map<string, number>();

  if (erpSent.status === 'fulfilled') {
    erpSent.value.docs.forEach((d) => {
      const k = String(d.data().fecha_envio_erp ?? '').slice(0, 10);
      if (k in erpOk) erpOk[k]++;
    });
  } else {
    console.error('[monitoreo/health] envíos ERP fallaron:', erpSent.reason);
    errors.push('No se pudo leer los envíos al ERP.');
  }

  if (mvpSent.status === 'fulfilled') {
    mvpSent.value.docs.forEach((d) => {
      const k = String(d.data().fecha_envio_mvp ?? '').slice(0, 10);
      if (k in mvpOk) mvpOk[k]++;
    });
  } else {
    console.error('[monitoreo/health] envíos MVP fallaron:', mvpSent.reason);
    errors.push('No se pudo leer los envíos a MVP.');
  }

  const recentErrors: Array<{ id: string; code: string; message: string; userEmail: string | null; at: string | null }> = [];
  if (errorLogs.status === 'fulfilled') {
    errorLogs.value.docs.forEach((doc) => {
      const data = doc.data();
      const at = toDate(data.timestamp);
      const k = at ? dayKey(at) : null;
      errorsByCode.set(data.code, (errorsByCode.get(data.code) ?? 0) + 1);
      const browser = browserFromUserAgent(data.userAgent);
      browserCounts.set(browser, (browserCounts.get(browser) ?? 0) + 1);
      if (k && data.code === LOG_CODES.ERR_ERP_SEND && k in erpFail) erpFail[k]++;
      if (k && data.code === LOG_CODES.ERR_MVP_SEND && k in mvpFail) mvpFail[k]++;
      if (data.code === LOG_CODES.ERR_IMAGE_LOAD) {
        const fuente = data.metadata?.pagina || 'Desconocida';
        imageErrorsBySource.set(fuente, (imageErrorsBySource.get(fuente) ?? 0) + 1);
      }
      if (data.code === LOG_CODES.ERR_ERP_CREDENTIALS_MISSING) {
        credentialFallbacks++;
        const who = data.userEmail ?? 'desconocido';
        const c = credentialMissing.get(who) ?? { count: 0, last: 0 };
        c.count++;
        c.last = Math.max(c.last, at?.getTime() ?? 0);
        credentialMissing.set(who, c);
      }
      if (recentErrors.length < 8 && (data.code === LOG_CODES.ERR_ERP_SEND || data.code === LOG_CODES.ERR_MVP_SEND)) {
        recentErrors.push({
          id: doc.id,
          code: data.code,
          message: data.message,
          userEmail: data.userEmail ?? null,
          at: at?.toISOString() ?? null,
        });
      }
    });
  } else {
    console.error('[monitoreo/health] logs de error fallaron:', errorLogs.reason);
    errors.push('No se pudo leer los logs de error (posible falta del índice category + timestamp).');
  }

  // ── Seguridad ─────────────────────────────────────────────────────────────
  const failedByDay = blank();
  const byEmail = new Map<string, { count: number; last: number; ips: Set<string> }>();
  const byIp = new Map<string, { count: number; last: number }>();
  let unauthorized24h = 0;
  const cutoff24h = Date.now() - DAY_MS;

  if (securityLogs.status === 'fulfilled') {
    securityLogs.value.docs.forEach((doc) => {
      const data = doc.data();
      const at = toDate(data.timestamp);
      if (!at) return;
      const k = dayKey(at);
      const browser = browserFromUserAgent(data.userAgent);
      browserCounts.set(browser, (browserCounts.get(browser) ?? 0) + 1);
      if (data.code === LOG_CODES.SEC_LOGIN_FAILED) {
        if (k in failedByDay) failedByDay[k]++;
        if (at.getTime() >= cutoff24h) {
          const email = String(data.metadata?.attemptedEmail ?? data.userEmail ?? 'desconocido').toLowerCase();
          const e = byEmail.get(email) ?? { count: 0, last: 0, ips: new Set<string>() };
          e.count++;
          e.last = Math.max(e.last, at.getTime());
          if (data.ip) e.ips.add(data.ip);
          byEmail.set(email, e);
          if (data.ip) {
            const i = byIp.get(data.ip) ?? { count: 0, last: 0 };
            i.count++;
            i.last = Math.max(i.last, at.getTime());
            byIp.set(data.ip, i);
          }
        }
      } else if (data.code === LOG_CODES.SEC_UNAUTHORIZED_ACCESS && at.getTime() >= cutoff24h) {
        unauthorized24h++;
      }
    });
  } else {
    console.error('[monitoreo/health] logs de seguridad fallaron:', securityLogs.reason);
    errors.push('No se pudo leer los logs de seguridad.');
  }

  // ── Productividad semanal (ERP + MVP) ────────────────────────────────────
  const weeks: string[] = [];
  for (let i = PRODUCTIVITY_WEEKS - 1; i >= 0; i--) {
    weeks.push(isoWeekStart(new Date(Date.now() - i * 7 * DAY_MS)));
  }
  const productivity = new Map<string, Record<string, { erp: number; mvp: number }>>();
  const ensureUser = (user: string) => {
    if (!productivity.has(user)) {
      productivity.set(user, Object.fromEntries(weeks.map((w) => [w, { erp: 0, mvp: 0 }])));
    }
    return productivity.get(user)!;
  };

  if (erpProductivity.status === 'fulfilled') {
    erpProductivity.value.docs.forEach((d) => {
      const data = d.data();
      const at = toDate(data.fecha_envio_erp);
      if (!at) return;
      const w = isoWeekStart(at);
      const user = data.enviado_por || 'Desconocido';
      const bucket = ensureUser(user);
      if (w in bucket) bucket[w].erp++;
    });
  } else {
    console.error('[monitoreo/health] productividad ERP falló:', erpProductivity.reason);
    errors.push('No se pudo calcular la productividad de ERP.');
  }

  if (mvpProductivity.status === 'fulfilled') {
    mvpProductivity.value.docs.forEach((d) => {
      const data = d.data();
      const at = toDate(data.fecha_envio_mvp);
      if (!at) return;
      const w = isoWeekStart(at);
      const user = data.enviado_mvp_por || 'Desconocido';
      const bucket = ensureUser(user);
      if (w in bucket) bucket[w].mvp++;
    });
  } else {
    console.error('[monitoreo/health] productividad MVP falló:', mvpProductivity.reason);
    errors.push('No se pudo calcular la productividad de MVP.');
  }

  const productivityByUser = Array.from(productivity.entries())
    .map(([usuario, byWeek]) => {
      const series = weeks.map((w) => ({ semana: w.slice(5), erp: byWeek[w].erp, mvp: byWeek[w].mvp }));
      const total = series.reduce((s, w) => s + w.erp + w.mvp, 0);
      return { usuario, series, total };
    })
    .filter((u) => u.total > 0)
    .sort((a, b) => b.total - a.total);

  // ── Subastas próximas sin revisar ────────────────────────────────────────
  let pendingAuctions: Array<{ id: string; titulo: string; fecha_subasta: string | null; fuente: string | null }> = [];
  if (upcomingAuctions.status === 'fulfilled') {
    pendingAuctions = upcomingAuctions.value.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          titulo: data.titulo ?? 'Sin título',
          fecha_subasta: toDate(data.fecha_subasta)?.toISOString() ?? null,
          fuente: data.fuente ?? null,
          estado: data.estado,
          en_calendario: !!data.en_calendario,
        };
      })
      .filter(
        (s) =>
          s.estado !== 'cerrada' &&
          !s.en_calendario &&
          s.fecha_subasta &&
          new Date(s.fecha_subasta) >= now &&
          new Date(s.fecha_subasta) <= upcomingLimit,
      )
      .sort((a, b) => (a.fecha_subasta ?? '').localeCompare(b.fecha_subasta ?? ''))
      .slice(0, 20)
      .map(({ id, titulo, fecha_subasta, fuente }) => ({ id, titulo, fecha_subasta, fuente }));
  } else {
    console.error('[monitoreo/health] subastas próximas falló:', upcomingAuctions.reason);
    errors.push('No se pudo obtener las subastas próximas sin revisar.');
  }

  const sum = (r: Record<string, number>) => Object.values(r).reduce((s, n) => s + n, 0);
  const series = (ok: Record<string, number>, fail: Record<string, number>) =>
    days.map((d) => ({ fecha: d.slice(5), ok: ok[d], fallos: fail[d] }));

  return NextResponse.json({
    success: true,
    erp: { series: series(erpOk, erpFail), totalOk: sum(erpOk), totalFail: sum(erpFail) },
    mvp: { series: series(mvpOk, mvpFail), totalOk: sum(mvpOk), totalFail: sum(mvpFail) },
    recentErrors,
    errorsByCode: Array.from(errorsByCode.entries())
      .map(([code, total]) => ({ code, total }))
      .sort((a, b) => b.total - a.total),
    credentialFallbacks,
    credentialMissing: Array.from(credentialMissing.entries())
      .map(([email, v]) => ({ email, count: v.count, last: v.last ? new Date(v.last).toISOString() : null }))
      .sort((a, b) => b.count - a.count),
    logVolume: {
      total: logCount.status === 'fulfilled' ? logCount.value.data().count : null,
      oldest:
        oldestLog.status === 'fulfilled' && !oldestLog.value.empty
          ? (toDate(oldestLog.value.docs[0].data().timestamp)?.toISOString() ?? null)
          : null,
    },
    freshness: {
      lastMachine: lastMachine.status === 'fulfilled' ? lastMachine.value : null,
      lastAuction: lastAuction.status === 'fulfilled' ? lastAuction.value : null,
    },
    security: {
      failedByDay: days.map((d) => ({ fecha: d.slice(5), total: failedByDay[d] })),
      suspiciousEmails: Array.from(byEmail.entries())
        .map(([email, v]) => ({ email, count: v.count, ips: v.ips.size, last: new Date(v.last).toISOString() }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      suspiciousIps: Array.from(byIp.entries())
        .map(([ip, v]) => ({ ip, count: v.count, last: new Date(v.last).toISOString() }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      unauthorized24h,
      failed24h: Array.from(byEmail.values()).reduce((s, v) => s + v.count, 0),
    },
    productivity: { weeks: weeks.map((w) => w.slice(5)), byUser: productivityByUser },
    pendingAuctions,
    browserErrors: Array.from(browserCounts.entries())
      .map(([browser, total]) => ({ browser, total }))
      .sort((a, b) => b.total - a.total),
    imageErrorsBySource: Array.from(imageErrorsBySource.entries())
      .map(([fuente, total]) => ({ fuente, total }))
      .sort((a, b) => b.total - a.total),
    collectionSizes: {
      maquinas: machinesCount.status === 'fulfilled' ? machinesCount.value.data().count : null,
      portafolio: portafolioCount.status === 'fulfilled' ? portafolioCount.value.data().count : null,
      subastas: subastasCount.status === 'fulfilled' ? subastasCount.value.data().count : null,
    },
    errors,
  });
}
