'use client';

import { useEffect } from 'react';
import { logError } from '@/lib/logger';
import { LOG_CODES } from '@/constants/logCodes';

let listenersRegistered = false;

// Captura errores no atrapados y promesas rechazadas sin manejar en todo el
// árbol de cliente. No renderiza nada.
export default function MonitoringInit() {
  useEffect(() => {
    if (listenersRegistered) return;
    listenersRegistered = true;

    const handleError = (event: ErrorEvent) => {
      logError(LOG_CODES.ERR_UNCAUGHT_CLIENT, event.message || 'Error no atrapado en cliente', {
        stack: event.error?.stack,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      logError(
        LOG_CODES.ERR_UNCAUGHT_CLIENT,
        reason?.message || 'Promesa rechazada sin manejar',
        { stack: reason?.stack },
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
