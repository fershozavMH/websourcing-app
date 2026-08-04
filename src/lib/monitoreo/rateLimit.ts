import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from '@/constants/monitoreo';

// Limitador en memoria, por instancia de servidor. No coordina entre múltiples
// instancias/regiones y se reinicia con cada redeploy — aceptable dado que no
// existe infraestructura de rate limiting en este proyecto; protege el
// endpoint de logs contra flood básico, no es una defensa distribuida.
const hits = new Map<string, number[]>();

let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < RATE_LIMIT_WINDOW_MS) return;
  lastSweep = now;
  for (const [key, timestamps] of hits.entries()) {
    const fresh = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (fresh.length === 0) hits.delete(key);
    else hits.set(key, fresh);
  }
}

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  sweep(now);

  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    hits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return false;
}
