import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';

// Self-check contra /api/monitoreo/access: no registra nada, se usa solo
// para decidir si mostrar el botón de navegación — la ruta /monitoreo hace
// su propia verificación de acceso.
export function useMonitoreoAccess(currentUser: User | null): boolean {
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!currentUser) {
        if (!cancelled) setHasAccess(false);
        return;
      }
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch('/api/monitoreo/access', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => null);
        if (!cancelled) setHasAccess(Boolean(data?.hasAccess));
      } catch {
        if (!cancelled) setHasAccess(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  return hasAccess;
}
