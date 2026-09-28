'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { auth } from '@/lib/firebase';
import {
  FAILED_LOGIN_ALERT_THRESHOLD,
  LOG_RETENTION_DAYS,
  LOG_VOLUME_WARN_DOCS,
  STALE_DATA_CRIT_HOURS,
  STALE_DATA_WARN_HOURS,
} from '@/constants/monitoreo';

const REFRESH_MS = 60_000;

interface Series {
  fecha: string;
  ok: number;
  fallos: number;
}

interface HealthData {
  erp: { series: Series[]; totalOk: number; totalFail: number };
  mvp: { series: Series[]; totalOk: number; totalFail: number };
  recentErrors: Array<{ id: string; code: string; message: string; userEmail: string | null; at: string | null }>;
  errorsByCode: Array<{ code: string; total: number }>;
  credentialFallbacks: number;
  credentialMissing: Array<{ email: string; count: number; last: string | null }>;
  logVolume: { total: number | null; oldest: string | null };
  freshness: { lastMachine: string | null; lastAuction: string | null };
  security: {
    failedByDay: Array<{ fecha: string; total: number }>;
    suspiciousEmails: Array<{ email: string; count: number; ips: number; last: string }>;
    suspiciousIps: Array<{ ip: string; count: number; last: string }>;
    unauthorized24h: number;
    failed24h: number;
  };
  errors: string[];
}

type Level = 'ok' | 'warn' | 'crit';

const LEVEL_STYLES: Record<Level, string> = {
  ok: 'bg-green-100 text-green-700 border-green-300',
  warn: 'bg-amber-100 text-amber-800 border-amber-300',
  crit: 'bg-red-100 text-red-700 border-red-300',
};

function hoursSince(iso: string | null): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

function freshnessLevel(hours: number | null): Level {
  if (hours === null || hours >= STALE_DATA_CRIT_HOURS) return 'crit';
  if (hours >= STALE_DATA_WARN_HOURS) return 'warn';
  return 'ok';
}

function formatAge(hours: number | null): string {
  if (hours === null) return 'Sin datos';
  if (hours < 1) return `hace ${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `hace ${Math.round(hours)} h`;
  return `hace ${Math.round(hours / 24)} días`;
}

function StatusCard({ title, level, value, detail }: { title: string; level: Level; value: string; detail?: string }) {
  return (
    <div className={`rounded-xl border p-4 ${LEVEL_STYLES[level]}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{title}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
      {detail && <p className="text-xs mt-1 opacity-80">{detail}</p>}
    </div>
  );
}

function SendChart({ title, data }: { title: string; data: HealthData['erp'] }) {
  const total = data.totalOk + data.totalFail;
  const rate = total ? Math.round((data.totalOk / total) * 100) : null;
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
      <div className="flex justify-between items-baseline mb-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title} — últimos 14 días</h3>
        <span className="text-xs text-slate-500">
          {data.totalOk} exitosos · {data.totalFail} fallidos{rate !== null ? ` · ${rate}% éxito` : ''}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data.series}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="ok" name="Exitosos" stackId="a" fill="#10b981" />
          <Bar dataKey="fallos" name="Fallidos" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function SaludSistemaTab() {
  const [data, setData] = useState<HealthData | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/monitoreo/health', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json().catch(() => null);
      if (json?.success) {
        setData(json);
        setErrors(json.errors ?? []);
        setUpdatedAt(new Date());
      } else {
        setErrors([json?.error ?? 'No se pudo cargar la salud del sistema.']);
      }
    } catch {
      setErrors(['No se pudo conectar con el servidor.']);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  if (loading) return <div className="text-center text-slate-500 py-12">Cargando…</div>;

  const machineHours = hoursSince(data?.freshness.lastMachine ?? null);
  const auctionHours = hoursSince(data?.freshness.lastAuction ?? null);
  const erpFailToday = data?.erp.series.at(-1)?.fallos ?? 0;
  const mvpFailToday = data?.mvp.series.at(-1)?.fallos ?? 0;
  const failedTotal24h = data?.security.failed24h ?? 0;
  const worstAttempts = data?.security.suspiciousEmails[0]?.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">
          Se actualiza cada minuto{updatedAt ? ` · última: ${updatedAt.toLocaleTimeString('es-MX')}` : ''}.
        </p>
        <button onClick={load} className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg">
          Actualizar
        </button>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded text-sm space-y-1">
          {errors.map((err) => (
            <p key={err}>{err}</p>
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatusCard
              title="Scraper · máquinas"
              level={freshnessLevel(machineHours)}
              value={formatAge(machineHours)}
              detail={`Alerta tras ${STALE_DATA_WARN_HOURS} h sin datos nuevos`}
            />
            <StatusCard
              title="Scraper · subastas"
              level={freshnessLevel(auctionHours)}
              value={formatAge(auctionHours)}
              detail={`Alerta tras ${STALE_DATA_WARN_HOURS} h sin datos nuevos`}
            />
            <StatusCard
              title="Fallos ERP / MVP hoy"
              level={erpFailToday + mvpFailToday > 0 ? 'crit' : 'ok'}
              value={`${erpFailToday} / ${mvpFailToday}`}
              detail={data.credentialFallbacks ? `${data.credentialFallbacks} envíos con credenciales admin (14 d)` : undefined}
            />
            <StatusCard
              title="Logins fallidos 24 h"
              level={worstAttempts >= FAILED_LOGIN_ALERT_THRESHOLD ? 'crit' : failedTotal24h > 0 ? 'warn' : 'ok'}
              value={String(failedTotal24h)}
              detail={`${data.security.unauthorized24h} accesos no autorizados`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SendChart title="Envíos al ERP" data={data.erp} />
            <SendChart title="Envíos a MVP" data={data.mvp} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">
                Usuarios sin credenciales ERP propias
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Sus envíos se hicieron con credenciales admin (últimos 14 días), por lo que el ERP no los atribuye a ellos.
              </p>
              {data.credentialMissing.length === 0 ? (
                <p className="text-sm text-slate-500">Todos los envíos usaron credenciales propias.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                      <th className="py-2 px-2">Usuario</th>
                      <th className="py-2 px-2">Envíos</th>
                      <th className="py-2 px-2">Último</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.credentialMissing.map((c) => (
                      <tr key={c.email} className="border-b border-slate-100">
                        <td className="py-1.5 px-2 text-slate-800 break-all">{c.email}</td>
                        <td className="py-1.5 px-2 font-bold text-amber-700">{c.count}</td>
                        <td className="py-1.5 px-2 text-slate-500">
                          {c.last ? new Date(c.last).toLocaleString('es-MX') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Volumen de logs</h3>
              <p className="text-3xl font-black text-slate-800">
                {data.logVolume.total !== null ? data.logVolume.total.toLocaleString('es-MX') : '—'}
                <span className="text-sm font-medium text-slate-500"> documentos</span>
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Registro más antiguo:{' '}
                {data.logVolume.oldest ? new Date(data.logVolume.oldest).toLocaleDateString('es-MX') : '—'}
              </p>
              {data.logVolume.total !== null && data.logVolume.total >= LOG_VOLUME_WARN_DOCS && (
                <p className="mt-3 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded p-2">
                  Supera {LOG_VOLUME_WARN_DOCS.toLocaleString('es-MX')} documentos: revisa la política de retención.
                </p>
              )}
              <p className="text-xs text-slate-400 mt-3">
                Los logs nuevos expiran a los {LOG_RETENTION_DAYS} días si la política TTL está activa sobre el campo
                expireAt.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Últimos fallos de envío</h3>
            {data.recentErrors.length === 0 ? (
              <p className="text-sm text-slate-500">Sin fallos de envío en los últimos 14 días.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {data.recentErrors.map((e) => (
                  <li key={e.id} className="py-2">
                    <span className="text-xs font-bold text-red-600">{e.code}</span>
                    <span className="text-xs text-slate-400">
                      {' '}
                      · {e.at ? new Date(e.at).toLocaleString('es-MX') : '—'} · {e.userEmail ?? 'sistema'}
                    </span>
                    <p className="text-slate-700 break-words">{e.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Logins fallidos por día</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.security.failedByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" name="Fallidos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Errores por código (14 d)</h3>
              {data.errorsByCode.length === 0 ? (
                <p className="text-sm text-slate-500">Sin errores registrados.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {data.errorsByCode.map((e) => (
                      <tr key={e.code} className="border-b border-slate-100">
                        <td className="py-1.5 px-2 text-slate-700">{e.code}</td>
                        <td className="py-1.5 px-2 text-right font-bold text-slate-800">{e.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
                Correos con intentos fallidos (24 h)
              </h3>
              {data.security.suspiciousEmails.length === 0 ? (
                <p className="text-sm text-slate-500">Sin intentos fallidos.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                      <th className="py-2 px-2">Correo</th>
                      <th className="py-2 px-2">Intentos</th>
                      <th className="py-2 px-2">IPs</th>
                      <th className="py-2 px-2">Último</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.security.suspiciousEmails.map((e) => (
                      <tr key={e.email} className="border-b border-slate-100">
                        <td className="py-1.5 px-2 text-slate-800 break-all">{e.email}</td>
                        <td
                          className={`py-1.5 px-2 font-bold ${
                            e.count >= FAILED_LOGIN_ALERT_THRESHOLD ? 'text-red-600' : 'text-slate-700'
                          }`}
                        >
                          {e.count}
                        </td>
                        <td className="py-1.5 px-2 text-slate-500">{e.ips}</td>
                        <td className="py-1.5 px-2 text-slate-500">{new Date(e.last).toLocaleTimeString('es-MX')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">IPs con intentos fallidos (24 h)</h3>
              {data.security.suspiciousIps.length === 0 ? (
                <p className="text-sm text-slate-500">Sin intentos fallidos.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                      <th className="py-2 px-2">IP</th>
                      <th className="py-2 px-2">Intentos</th>
                      <th className="py-2 px-2">Último</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.security.suspiciousIps.map((i) => (
                      <tr key={i.ip} className="border-b border-slate-100">
                        <td className="py-1.5 px-2 text-slate-800">{i.ip}</td>
                        <td
                          className={`py-1.5 px-2 font-bold ${
                            i.count >= FAILED_LOGIN_ALERT_THRESHOLD ? 'text-red-600' : 'text-slate-700'
                          }`}
                        >
                          {i.count}
                        </td>
                        <td className="py-1.5 px-2 text-slate-500">{new Date(i.last).toLocaleTimeString('es-MX')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
