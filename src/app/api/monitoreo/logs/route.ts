import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebase-admin';
import { writeLog } from '@/lib/monitoreo/writeLog';
import { isRateLimited } from '@/lib/monitoreo/rateLimit';
import { getClientIp, requireMonitoreoAdmin } from '@/lib/monitoreo/auth';
import {
  LOG_CATEGORIES,
  LOG_CODE_TO_CATEGORY,
  LOG_LEVELS,
  LOG_SOURCES,
  isKnownLogCode,
  type LogCategory,
  type LogLevel,
} from '@/constants/logCodes';
import {
  LOGS_PAGE_SIZE_DEFAULT,
  LOGS_PAGE_SIZE_MAX,
  LOG_REQUEST_MAX_BYTES,
  SYSTEM_LOGS_COLLECTION,
} from '@/constants/monitoreo';

// POST: acepta eventos sin autenticación (así se registran intentos de login
// fallidos o probes anónimos). Superficie hostil por diseño — ver validaciones abajo.
export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > LOG_REQUEST_MAX_BYTES) {
    return NextResponse.json({ success: false, error: 'Payload demasiado grande.' }, { status: 400 });
  }

  const ip = getClientIp(request) ?? 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ success: false, error: 'Demasiadas solicitudes.' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido.' }, { status: 400 });
  }

  const { level, category, code, message, stack, source, route, userEmail, metadata, clientTimestamp } = body as Record<string, unknown>;

  if (typeof level !== 'string' || !LOG_LEVELS.includes(level as LogLevel)) {
    return NextResponse.json({ success: false, error: 'level inválido.' }, { status: 400 });
  }
  if (typeof category !== 'string' || !LOG_CATEGORIES.includes(category as LogCategory)) {
    return NextResponse.json({ success: false, error: 'category inválido.' }, { status: 400 });
  }
  if (typeof code !== 'string' || !isKnownLogCode(code)) {
    return NextResponse.json({ success: false, error: 'code inválido.' }, { status: 400 });
  }
  if (LOG_CODE_TO_CATEGORY[code] !== category) {
    return NextResponse.json({ success: false, error: 'category no corresponde a code.' }, { status: 400 });
  }
  if (typeof message !== 'string' || message.length === 0) {
    return NextResponse.json({ success: false, error: 'message requerido.' }, { status: 400 });
  }
  if (typeof source !== 'string' || !LOG_SOURCES.includes(source as 'client' | 'server')) {
    return NextResponse.json({ success: false, error: 'source inválido.' }, { status: 400 });
  }

  await writeLog({
    level: level as LogLevel,
    category: category as LogCategory,
    code,
    message,
    stack: typeof stack === 'string' ? stack : undefined,
    source: source as 'client' | 'server',
    route: typeof route === 'string' ? route : undefined,
    userEmail: typeof userEmail === 'string' ? userEmail : undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
    ip,
    metadata: metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : undefined,
    clientTimestamp: typeof clientTimestamp === 'string' ? clientTimestamp : undefined,
  });

  return NextResponse.json({ success: true });
}

// GET: solo admins de monitoreo. Filtra por categoría/nivel/rango de fechas/código,
// con paginación por cursor. La búsqueda por texto se filtra en memoria sobre la página.
export async function GET(request: Request) {
  const guard = await requireMonitoreoAdmin(request);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const level = searchParams.get('level');
  const code = searchParams.get('code');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const search = searchParams.get('search');
  const cursor = searchParams.get('cursor');
  const pageSize = Math.min(
    Number(searchParams.get('pageSize') ?? LOGS_PAGE_SIZE_DEFAULT) || LOGS_PAGE_SIZE_DEFAULT,
    LOGS_PAGE_SIZE_MAX,
  );

  try {
    const db = getFirestore();
    let query: FirebaseFirestore.Query = db.collection(SYSTEM_LOGS_COLLECTION).orderBy('timestamp', 'desc');

    if (category) query = query.where('category', '==', category);
    if (level) query = query.where('level', '==', level);
    if (code) query = query.where('code', '==', code);
    if (from) query = query.where('timestamp', '>=', new Date(from));
    if (to) query = query.where('timestamp', '<=', new Date(to));

    if (cursor) {
      const cursorDoc = await db.collection(SYSTEM_LOGS_COLLECTION).doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snapshot = await query.limit(pageSize).get();
    let logs: Array<{ id: string; message?: string; [key: string]: unknown }> = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (search) {
      const needle = search.toLowerCase();
      logs = logs.filter((log) => typeof log.message === 'string' && log.message.toLowerCase().includes(needle));
    }

    const nextCursor = snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1].id : null;

    return NextResponse.json({ success: true, logs, nextCursor });
  } catch (error: any) {
    console.error('[monitoreo/logs GET] error:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error al obtener logs.' },
      { status: 500 },
    );
  }
}
