'use client';

import { useEffect } from 'react';
import { logActivity } from '@/lib/logger';
import { LOG_CODES } from '@/constants/logCodes';

// Registra una vista de sección una vez por montaje, solo cuando el usuario
// ya está autenticado (evita contar la pantalla de carga previa al login).
export function usePageView(section: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    logActivity(LOG_CODES.ACT_PAGE_VIEW, `Vista de ${section}`, { metadata: { section } });
    // Solo al activarse: no debe repetirse en cada re-render de la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
