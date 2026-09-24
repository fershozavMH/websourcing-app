import '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getClientIp } from '@/lib/monitoreo/auth';
import { writeLog } from '@/lib/monitoreo/writeLog';
import { isRateLimited } from '@/lib/monitoreo/rateLimit';
import { LOG_CODES } from '@/constants/logCodes';

interface RequireUserResult {
  ok: true;
  email: string;
  name: string;
}

interface RequireUserFailure {
  ok: false;
  response: NextResponse;
}

async function verifyToken(request: Request): Promise<{ email: string; name: string } | null> {
  const match = (request.headers.get('authorization') ?? '').match(/^Bearer (.+)$/);
  if (!match) return null;
  try {
    const decoded = await getAuth().verifyIdToken(match[1]);
    if (!decoded.email) return null;
    const email = decoded.email.toLowerCase();
    return { email, name: (decoded.name as string | undefined) || email };
  } catch {
    return null;
  }
}

// Punto de entrada para rutas que deben exigir sesión (cualquier usuario
// autenticado, sin restricción de rol — herramienta interna donde todo
// usuario logueado tiene los mismos permisos). Distinto de
// requireMonitoreoAdmin, que además exige pertenecer a la lista de admins.
// Aplica también un rate limit por usuario para proteger los sistemas externos.
export async function requireAuthenticatedUser(
  request: Request,
): Promise<RequireUserResult | RequireUserFailure> {
  const route = new URL(request.url).pathname;
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') ?? undefined;

  const user = await verifyToken(request);
  if (!user) {
    await writeLog({
      level: 'security',
      category: 'security',
      code: LOG_CODES.SEC_UNAUTHORIZED_ACCESS,
      message: `Intento de acceso a ${route} sin token válido`,
      source: 'server',
      route,
      ip,
      userAgent,
    });
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'No autenticado.' }, { status: 401 }),
    };
  }

  if (isRateLimited(`${route}:${user.email}`)) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }, { status: 429 }),
    };
  }

  return { ok: true, email: user.email, name: user.name };
}
