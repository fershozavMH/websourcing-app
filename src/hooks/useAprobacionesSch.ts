import { useEffect, useSyncExternalStore } from 'react';
import { auth } from '@/lib/firebase';

export interface AprobacionSch {
  aprobadoPor: string;
  aprobadoEmail: string;
  aprobadoEn: string;
  venceEn: string;
}

interface EstadoAprobaciones {
  puedeAprobar: boolean;
  aprobaciones: Record<string, AprobacionSch>;
}

// Estado compartido por todas las tarjetas: una sola petición por página en
// lugar de una por máquina, y al aprobar desde una tarjeta se actualizan todas.
let estado: EstadoAprobaciones = { puedeAprobar: false, aprobaciones: {} };
let carga: Promise<void> | null = null;
const listeners = new Set<() => void>();

const notificar = () => listeners.forEach((l) => l());
const suscribir = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const cargar = async () => {
  await auth.authStateReady();
  const token = await auth.currentUser?.getIdToken();
  if (!token) return;
  const res = await fetch('/api/sch/aprobaciones', { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json().catch(() => null);
  if (data?.success) {
    estado = { puedeAprobar: !!data.puedeAprobar, aprobaciones: data.aprobaciones ?? {} };
    notificar();
  }
};

const cambiarAprobacion = async (docId: string, accion: 'aprobar' | 'quitar'): Promise<string | null> => {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch('/api/sch/aprobaciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ docId, accion }),
  });
  const data = await res.json().catch(() => null);
  if (!data?.success) return data?.error ?? 'No se pudo guardar la aprobación.';

  const aprobaciones = { ...estado.aprobaciones };
  if (data.aprobacion) aprobaciones[docId] = data.aprobacion;
  else delete aprobaciones[docId];
  estado = { ...estado, aprobaciones };
  notificar();
  return null;
};

export function useAprobacionesSch() {
  const actual = useSyncExternalStore(suscribir, () => estado, () => estado);

  useEffect(() => {
    if (!carga) carga = cargar().catch(() => { carga = null; });
  }, []);

  return { ...actual, cambiarAprobacion };
}
