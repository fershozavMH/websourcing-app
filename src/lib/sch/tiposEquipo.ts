import { CAT, TRACTOCAMION_SUBTYPES } from '@/constants/machineCategories';

// Unidad en la que cada categoría registra `capacidad` en Firestore.
export type UnidadCapacidad = 'Ton' | 'm' | 'lbs' | 'Gal' | 'Yd';

export interface TipoEquipo {
  slug: string;
  nombre: string;
  categorias: ReadonlyArray<string>;
  // null = la categoría no registra capacidad; el filtro de capacidad no se aplica
  unidad: UnidadCapacidad | null;
  // Solo Bombas: el scraper no distingue el montaje, se infiere del título
  montajeBomba?: 'camion' | 'estacionaria';
}

const MAQUINARIA_PESADA = [
  CAT.RETROEXCAVADORAS, CAT.EXCAVADORAS, CAT.TOPADORES,
  CAT.CARGADORES, CAT.MOTOCONFORMADORAS, CAT.COMPACTADORAS,
];

export const TIPOS_EQUIPO: ReadonlyArray<TipoEquipo> = [
  { slug: 'grua_titan',                  nombre: 'Grúa Titán',                      categorias: [CAT.GRUAS_TITANES],     unidad: 'Ton' },
  { slug: 'grua_articulada',             nombre: 'Grúa articulada',                 categorias: [CAT.GRUAS_ARTICULADAS], unidad: 'Ton' },
  { slug: 'grua_rough_terrain',          nombre: 'Grúa Rough Terrain',              categorias: [CAT.ROUGH_TERRAIN],     unidad: 'Ton' },
  { slug: 'grua_todo_terreno',           nombre: 'Grúa todo terreno',               categorias: [CAT.ALL_TERRAIN],       unidad: 'Ton' },
  { slug: 'bomba_concreto_camion',       nombre: 'Bomba de concreto sobre camión',  categorias: [CAT.BOMBAS],            unidad: 'm', montajeBomba: 'camion' },
  { slug: 'bomba_concreto_estacionaria', nombre: 'Bomba de concreto estacionaria',  categorias: [CAT.BOMBAS],            unidad: 'm', montajeBomba: 'estacionaria' },
  { slug: 'camion_revolvedor',           nombre: 'Camión revolvedor / trompo',      categorias: [CAT.CAMIONES_TROMPO],   unidad: 'Yd' },
  { slug: 'camion_pipa',                 nombre: 'Camión pipa',                     categorias: [CAT.CAMIONES_PIPA],     unidad: 'Gal' },
  { slug: 'camion_volteo',               nombre: 'Camión de volteo',                categorias: [CAT.CAMIONES_VOLTEO],   unidad: 'Yd' },
  { slug: 'tractocamion',                nombre: 'Tractocamión',                    categorias: [...TRACTOCAMION_SUBTYPES, CAT.TRACTOCAMIONES], unidad: null },
  { slug: 'elevador',                    nombre: 'Equipo de elevación',             categorias: [CAT.ELEVADORES],        unidad: 'lbs' },
  { slug: 'retroexcavadora',             nombre: 'Retroexcavadora',                 categorias: [CAT.RETROEXCAVADORAS],  unidad: null },
  { slug: 'excavadora',                  nombre: 'Excavadora',                      categorias: [CAT.EXCAVADORAS],       unidad: null },
  { slug: 'topador',                     nombre: 'Topador',                         categorias: [CAT.TOPADORES],         unidad: null },
  { slug: 'cargador',                    nombre: 'Cargador frontal',                categorias: [CAT.CARGADORES],        unidad: null },
  { slug: 'motoconformadora',            nombre: 'Motoconformadora',                categorias: [CAT.MOTOCONFORMADORAS], unidad: null },
  { slug: 'compactadora',                nombre: 'Compactadora',                    categorias: [CAT.COMPACTADORAS],     unidad: null },
  { slug: 'maquinaria_pesada',           nombre: 'Maquinaria pesada',               categorias: MAQUINARIA_PESADA,       unidad: null },
];

export const SLUGS_VALIDOS = TIPOS_EQUIPO.map(t => t.slug);

// "Grúa Titán" → "grua_titan"
const normalizar = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/[\s\-/]+/g, '_');

// El agente puede mandar el slug, el nombre o la categoría interna de Web Sourcing.
export const resolverTipoEquipo = (raw: string | null): TipoEquipo | null => {
  if (!raw?.trim()) return null;
  const buscado = normalizar(raw);
  return TIPOS_EQUIPO.find(t =>
    t.slug === buscado ||
    normalizar(t.nombre) === buscado ||
    (t.categorias.length === 1 && !t.montajeBomba && normalizar(t.categorias[0]) === buscado),
  ) ?? null;
};

// Bombas de remolque/estacionarias: Putzmeister BSA, Schwing SP y las que lo dicen en el título.
// Ojo: Schwing "BPL…-KVM39X" es la unidad de bombeo de una pluma sobre camión, no estacionaria.
// Todo lo demás (pluma montada, "38M ... ON A MACK") se considera sobre camión.
const PATRON_ESTACIONARIA = /\b(BSA\s?\d|SP\s?\d{3,4}|stationary|trailer|line pump|estacionaria)/i;

export const montajeDeBomba = (titulo: string): 'camion' | 'estacionaria' =>
  PATRON_ESTACIONARIA.test(titulo) ? 'estacionaria' : 'camion';

// Tipo específico de un equipo ya leído (útil cuando se busca por grupo, p. ej. maquinaria_pesada).
export const tipoDeEquipo = (categoria: string, titulo: string): TipoEquipo | null => {
  if (categoria === CAT.BOMBAS) {
    const montaje = montajeDeBomba(titulo);
    return TIPOS_EQUIPO.find(t => t.montajeBomba === montaje) ?? null;
  }
  return TIPOS_EQUIPO.find(t => t.slug !== 'maquinaria_pesada' && t.categorias.includes(categoria)) ?? null;
};
