'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { logActivity } from '@/lib/logger';
import { LOG_CODES } from '@/constants/logCodes';
import { INACTIVITY_LOGOUT_MS } from '@/constants/appConfig';
import { PRESENCE_PING_INTERVAL_MS } from '@/constants/monitoreo';

const STORAGE_KEY = 'wsl_last_activity';
const CHECK_INTERVAL_MS = 60_000;
const WRITE_THROTTLE_MS = 30_000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const;

// Cierra sesión tras `timeoutMs` sin interacción del usuario. La marca de
// última actividad vive en localStorage (no en memoria) para que sobreviva
// a navegaciones/recargas de página dentro de la misma pestaña.
export function useInactivityLogout(enabled: boolean, timeoutMs: number = INACTIVITY_LOGOUT_MS) {
  const router = useRouter();
  const lastWriteRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let loggingOut = false;

    const isExpired = () => {
      try {
        const last = Number(localStorage.getItem(STORAGE_KEY));
        return Number.isFinite(last) && last > 0 && Date.now() - last >= timeoutMs;
      } catch {
        return false;
      }
    };

    const expire = async () => {
      if (loggingOut) return;
      loggingOut = true;
      clearInterval(interval);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // no fatal
      }
      logActivity(LOG_CODES.ACT_SESSION_TIMEOUT, 'Sesión cerrada automáticamente por inactividad');
      try {
        await signOut(auth);
      } finally {
        router.push('/login');
      }
    };

    const markActivity = () => {
      const now = Date.now();
      if (now - lastWriteRef.current < WRITE_THROTTLE_MS) return;
      // Si la sesión ya expiró (p. ej. laptop suspendida o navegador cerrado
      // con sesión persistida), la actividad nueva no debe revivirla.
      if (isExpired()) {
        void expire();
        return;
      }
      lastWriteRef.current = now;
      try {
        localStorage.setItem(STORAGE_KEY, String(now));
      } catch {
        // localStorage puede no estar disponible (modo privado, etc.); sin
        // persistencia no se puede medir inactividad entre recargas, no es fatal
      }
    };

    // Latido de presencia para el panel de monitoreo: solo si hubo actividad
    // reciente, así una pestaña abandonada no figura como "en línea".
    const pingPresence = async () => {
      try {
        const last = Number(localStorage.getItem(STORAGE_KEY));
        if (!last || Date.now() - last > PRESENCE_PING_INTERVAL_MS * 2) return;
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        await fetch('/api/presence', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          keepalive: true,
        });
      } catch {
        // best-effort
      }
    };

    const interval = setInterval(() => {
      if (isExpired()) void expire();
    }, CHECK_INTERVAL_MS);
    const presenceInterval = setInterval(pingPresence, PRESENCE_PING_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible' && isExpired()) void expire();
    };
    document.addEventListener('visibilitychange', onVisible);

    // Al montar: si la marca guardada ya expiró, cerrar en vez de renovarla.
    if (isExpired()) {
      void expire();
    } else {
      markActivity();
      void pingPresence();
    }
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActivity, { passive: true }));

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActivity));
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
      clearInterval(presenceInterval);
    };
  }, [enabled, timeoutMs, router]);
}
