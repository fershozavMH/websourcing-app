import { auth } from '@/lib/firebase';
import { LOG_CODE_TO_CATEGORY, type LogCode } from '@/constants/logCodes';

interface LogOptions {
  stack?: string;
  route?: string;
  userEmail?: string;
  metadata?: Record<string, unknown>;
}

// Best-effort, "fire and forget": nunca debe lanzar ni reintentar. Un fallo al
// registrar un log no puede convertirse en un segundo fallo para el usuario.
function send(code: LogCode, message: string, options: LogOptions = {}) {
  try {
    const body = {
      level: LOG_CODE_TO_CATEGORY[code] === 'error' ? 'error' : LOG_CODE_TO_CATEGORY[code] === 'security' ? 'security' : 'info',
      category: LOG_CODE_TO_CATEGORY[code],
      code,
      message,
      stack: options.stack,
      source: 'client',
      route: options.route ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
      userEmail: options.userEmail ?? auth.currentUser?.email ?? undefined,
      metadata: options.metadata,
      clientTimestamp: new Date().toISOString(),
    };

    fetch('/api/monitoreo/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // swallow: el logger nunca debe interrumpir el flujo que lo invoca
  }
}

export function logError(code: LogCode, message: string, options?: LogOptions) {
  send(code, message, options);
}

export function logSecurity(code: LogCode, message: string, options?: LogOptions) {
  send(code, message, options);
}

export function logActivity(code: LogCode, message: string, options?: LogOptions) {
  send(code, message, options);
}
