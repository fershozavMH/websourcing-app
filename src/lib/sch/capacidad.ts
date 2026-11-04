import type { UnidadCapacidad } from './tiposEquipo';

export interface Capacidad {
  valor: number;
  unidad: UnidadCapacidad;
}

const PIES_A_METROS = 0.3048;

// Sufijos que usan los scrapers → unidad normalizada (y factor de conversión).
const UNIDADES: Record<string, [UnidadCapacidad, number]> = {
  t: ['Ton', 1], ton: ['Ton', 1], tons: ['Ton', 1], tonelada: ['Ton', 1], toneladas: ['Ton', 1],
  m: ['m', 1], mt: ['m', 1], mts: ['m', 1], meter: ['m', 1], meters: ['m', 1], metro: ['m', 1], metros: ['m', 1],
  ft: ['m', PIES_A_METROS], feet: ['m', PIES_A_METROS], pies: ['m', PIES_A_METROS],
  lb: ['lbs', 1], lbs: ['lbs', 1],
  gal: ['Gal', 1], gals: ['Gal', 1], galones: ['Gal', 1],
  yd: ['Yd', 1], yds: ['Yd', 1], yard: ['Yd', 1], yards: ['Yd', 1], yardas: ['Yd', 1],
};

// "23 Ton" → { 23, 'Ton' } · "38M" → { 38, 'm' } · "47 ft" → { 14.3, 'm' }.
// Sin número o sin unidad reconocible → null: no se adivina la unidad.
export const parseCapacidad = (raw: unknown): Capacidad | null => {
  if (typeof raw !== 'string') return null;
  const match = raw.trim().match(/^(\d+(?:\.\d+)?|\.\d+)\s*([a-z]+)/i);
  if (!match) return null;
  const unidad = UNIDADES[match[2].toLowerCase()];
  if (!unidad) return null;
  const valor = Number(match[1]) * unidad[1];
  if (!Number.isFinite(valor) || valor <= 0) return null;
  return { valor: Math.round(valor * 100) / 100, unidad: unidad[0] };
};

// Compatible = igual o mayor a lo requerido, hasta 50% más (no se ofrece una grúa
// de 500 ton para una necesidad de 23).
export const MARGEN_CAPACIDAD = 1.5;

export const esCapacidadCompatible = (cap: Capacidad | null, requerida: number, unidad: UnidadCapacidad): boolean =>
  !!cap && cap.unidad === unidad && cap.valor >= requerida && cap.valor <= requerida * MARGEN_CAPACIDAD;
