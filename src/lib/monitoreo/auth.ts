import '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { MONITOREO_ADMINS_COLLECTION } from '@/constants/monitoreo';
import { LOG_CODES } from '@/constants/logCodes';
import { writeLog } from '@/lib/monitoreo/writeLog';

export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? undefined;
}

export async function verifyIdTokenFromRequest(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('authorization') ?? '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) return null;

  try {
    const decoded = await getAuth().verifyIdToken(match[1]);
    return decoded.email ? decoded.email.toLowerCase() : null;
  } catch {
    return null;
  }
}

export async function isMonitoreoAdmin(email: string): Promise<boolean> {
  const db = getFirestore();
  const doc = await db.collection(MONITOREO_ADMINS_COLLECTION).doc(email.toLowerCase()).get();
  return doc.exists && doc.data()?.active === true;
}

interface RequireAdminResult {
  ok: true;
  email: string;
}

interface RequireAdminFailure {
  ok: false;
  response: NextResponse;
}

// Único punto de entrada para todas las rutas admin-only del módulo de monitoreo.
export async function requireMonitoreoAdmin(
  request: Request,
): Promise<RequireAdminResult | RequireAdminFailure> {
  const route = new URL(request.url).pathname;
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') ?? undefined;

  const email = await verifyIdTokenFromRequest(request);
  if (!email) {
    await writeLog({
      level: 'security',
      category: 'security',
      code: LOG_CODES.SEC_UNAUTHORIZED_ACCESS,
      message: 'Intento de acceso a ruta de monitoreo sin token válido',
      source: 'server',
      route,
      ip,
      userAgent,
    });
    return { ok: false, response: NextResponse.json({ success: false, error: 'No autenticado.' }, { status: 401 }) };
  }

  const isAdmin = await isMonitoreoAdmin(email);
  if (!isAdmin) {
    await writeLog({
      level: 'security',
      category: 'security',
      code: LOG_CODES.SEC_UNAUTHORIZED_ACCESS,
      message: `Usuario autenticado sin permisos de monitoreo intentó acceder a ${route}`,
      source: 'server',
      route,
      userEmail: email,
      ip,
      userAgent,
    });
    return { ok: false, response: NextResponse.json({ success: false, error: 'Acceso no autorizado.' }, { status: 403 }) };
  }

  return { ok: true, email };
}
