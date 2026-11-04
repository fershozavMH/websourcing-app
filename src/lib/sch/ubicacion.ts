import { USA_STATES, CAN_PROVINCES } from '@/constants/locations';

export type Pais = 'USA' | 'Canadá' | 'México';

export interface Ubicacion {
  ciudad: string | null;
  estado: string | null;   // abreviatura: "TX", "CA", "BC"
  pais: Pais | null;
}

const normalizar = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

// "TX - Texas" → { tx: 'TX', texas: 'TX' }. Las regiones ("WEST - Western USA") no son estados.
const construirMapa = (lista: ReadonlyArray<string>): Map<string, string> => {
  const mapa = new Map<string, string>();
  for (const entrada of lista) {
    const match = entrada.match(/^([A-Z]{2}) - (.+)$/);
    if (!match) continue;
    mapa.set(match[1].toLowerCase(), match[1]);
    mapa.set(normalizar(match[2]), match[1]);
  }
  return mapa;
};

const ESTADOS_USA = construirMapa(USA_STATES);
const PROVINCIAS_CAN = construirMapa(CAN_PROVINCES);

const resolverRegion = (texto: string): Omit<Ubicacion, 'ciudad'> | null => {
  const t = normalizar(texto);
  if (ESTADOS_USA.has(t)) return { estado: ESTADOS_USA.get(t)!, pais: 'USA' };
  if (PROVINCIAS_CAN.has(t)) return { estado: PROVINCIAS_CAN.get(t)!, pais: 'Canadá' };
  if (t === 'mexico' || t === 'mx') return { estado: null, pais: 'México' };
  // "Appleton WI": el estado viene pegado como última palabra
  const ultima = t.split(/\s+/).pop() ?? '';
  if (ultima !== t && ESTADOS_USA.has(ultima)) return { estado: ESTADOS_USA.get(ultima)!, pais: 'USA' };
  return null;
};

// Algunos sitios anteponen el vendedor a la ciudad ("ALLIANCE USED SUPERCENTER – Fort Worth").
// Se queda solo lo que va después del último guion para no exponer al proveedor.
const limpiarCiudad = (ciudad: string): string | null =>
  ciudad.split(/\s+[–—-]\s+/).pop()?.trim() || null;

// "Conroe, Texas" → { Conroe, TX, USA }. Regiones sueltas ("Western USA") solo dan país.
export const parseUbicacion = (raw: unknown): Ubicacion => {
  const vacia: Ubicacion = { ciudad: null, estado: null, pais: null };
  if (typeof raw !== 'string' || !raw.trim()) return vacia;

  const partes = raw.split(',').map(p => p.trim()).filter(Boolean);
  if (partes.length >= 2) {
    const region = resolverRegion(partes[1]) ?? (partes[2] ? resolverRegion(partes[2]) : null);
    if (region) return { ciudad: limpiarCiudad(partes[0]), ...region };
    // "Texas, USA": el estado viene en la primera parte
    const soloEstado = resolverRegion(partes[0]);
    return soloEstado ? { ciudad: null, ...soloEstado } : vacia;
  }

  const region = resolverRegion(partes[0]);
  if (region) return { ciudad: null, ...region };
  const t = normalizar(partes[0]);
  if (/\busa\b/.test(t)) return { ...vacia, pais: 'USA' };
  if (t.includes('canada')) return { ...vacia, pais: 'Canadá' };
  return vacia;
};
