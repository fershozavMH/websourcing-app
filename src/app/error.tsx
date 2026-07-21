'use client';

import { useEffect } from 'react';
import { logError } from '@/lib/logger';
import { LOG_CODES } from '@/constants/logCodes';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError(LOG_CODES.ERR_UNCAUGHT_CLIENT, error.message || 'Error no atrapado en una ruta', {
      stack: error.stack,
      metadata: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-slate-900 p-8 border-b-4 border-orange-500 text-center">
          <h1 className="text-2xl font-black tracking-tight text-white">Algo salió mal</h1>
        </div>
        <div className="p-8 text-center space-y-6">
          <p className="text-slate-600 text-sm">
            Ocurrió un error inesperado. El equipo de sistemas ya fue notificado.
          </p>
          <button
            onClick={reset}
            className="w-full py-3 px-4 rounded-lg font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-md"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}
