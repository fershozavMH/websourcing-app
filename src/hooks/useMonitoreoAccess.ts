import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';

// Self-check contra /api/monitoreo/admins: un 200 confirma que el correo
// está en monitoreo_admins. Se usa solo para decidir si mostrar el botón de
// navegación — la ruta /monitoreo hace su propia verificación de acceso.
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
        const res = await fetch('/api/monitoreo/admins', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) setHasAccess(res.ok);
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
