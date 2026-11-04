import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/monitoreo/auth';
import { writeLog } from '@/lib/monitoreo/writeLog';
import { isRateLimited } from '@/lib/monitoreo/rateLimit';
import { LOG_CODES } from '@/constants/logCodes';

type RequireApiKeyResult = { ok: true } | { ok: false; response: NextResponse };

// La plataforma del agente puede mandar la key como Bearer o como x-api-key,
// según lo que se configure en su pestaña Authentication.
function extractKey(request: Request): string {
  const bearer = (request.headers.get('authorization') ?? '').match(/^Bearer (.+)$/);
  if (bearer) return bearer[1].trim();
  return (request.headers.get('x-api-key') ?? '').trim();
}

// Mismo formato de error que las respuestas de la API del agente, para que
// nunca tenga que adivinar si la consulta falló.
const errorResponse = (mensaje: string, status: number) =>
  NextResponse.json({ status: 'error', mensaje, equipos: [] }, { status });

function keysMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Punto de entrada para rutas consumidas por agentes externos (sin sesión de
// Firebase). Distinto de requireAuthenticatedUser, que exige un usuario logueado.
export async function requireAgentApiKey(request: Request): Promise<RequireApiKeyResult> {
  const route = new URL(request.url).pathname;

  const expected = process.env.AGENT_API_KEY ?? '';
  if (!expected) {
    console.error('[agente] AGENT_API_KEY no está configurada');
    return { ok: false, response: errorResponse('Servicio no disponible.', 503) };
  }

  const provided = extractKey(request);
  if (!provided || !keysMatch(provided, expected)) {
    await writeLog({
      level: 'security',
      category: 'security',
      code: LOG_CODES.SEC_UNAUTHORIZED_ACCESS,
      message: `Intento de acceso a ${route} sin API key válida`,
      source: 'server',
      route,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? undefined,
    });
    return { ok: false, response: errorResponse('No autenticado.', 401) };
  }

  if (isRateLimited(`${route}:agente`)) {
    return { ok: false, response: errorResponse('Demasiadas solicitudes. Intenta de nuevo en un minuto.', 429) };
  }

  return { ok: true };
}
