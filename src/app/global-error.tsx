'use client';

import { useEffect } from 'react';
import { logError } from '@/lib/logger';
import { LOG_CODES } from '@/constants/logCodes';

// Boundary raíz: debe renderizar su propio html/body. Estilos inline como red
// de seguridad, ya que Tailwind podría no cargar en este punto de falla.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError(LOG_CODES.ERR_UNCAUGHT_CLIENT, error.message || 'Error no atrapado en el boundary raíz', {
      stack: error.stack,
      metadata: { digest: error.digest, boundary: 'global' },
    });
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#0f172a', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ maxWidth: 420, width: '100%', background: 'white', color: '#1e293b', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          <div style={{ background: '#0f172a', padding: '2rem', borderBottom: '4px solid #f97316', textAlign: 'center' }}>
            <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>Error crítico</h1>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.5rem' }}>
              La aplicación encontró un error grave. El equipo de sistemas ya fue notificado.
            </p>
            <button
              onClick={reset}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, fontWeight: 700, color: 'white', background: '#ea580c', border: 'none', cursor: 'pointer' }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
