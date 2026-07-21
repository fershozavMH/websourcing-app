'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { logActivity } from '@/lib/logger';
import { LOG_CODES } from '@/constants/logCodes';
import { INACTIVITY_LOGOUT_MS } from '@/constants/appConfig';

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

    const markActivity = () => {
      const now = Date.now();
      if (now - lastWriteRef.current < WRITE_THROTTLE_MS) return;
      lastWriteRef.current = now;
      try {
        localStorage.setItem(STORAGE_KEY, String(now));
      } catch {
        // localStorage puede no estar disponible (modo privado, etc.); sin
        // persistencia no se puede medir inactividad entre recargas, no es fatal
      }
    };

    markActivity();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActivity, { passive: true }));

    const interval = setInterval(async () => {
      let lastActivity = Date.now();
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) lastActivity = Number(stored);
      } catch {
        return;
      }

      if (Date.now() - lastActivity >= timeoutMs) {
        clearInterval(interval);
        logActivity(LOG_CODES.ACT_SESSION_TIMEOUT, 'Sesión cerrada automáticamente por inactividad');
        await signOut(auth);
        router.push('/login');
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActivity));
      clearInterval(interval);
    };
  }, [enabled, timeoutMs, router]);
}
