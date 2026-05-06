export const CAT = {
  EXCAVADORAS: 'Excavadoras',
  RETROEXCAVADORAS: 'Retroexcavadoras',
  TOPADORES: 'Topadores',
  CARGADORES: 'Cargadores',
  MOTOCONFORMADORAS: 'Motoconformadoras',
  CAMIONES_VOLTEO: 'Camiones Volteo',
  CAMIONES_TROMPO: 'Camiones Trompo',
  CAMIONES_PIPA: 'Camiones Pipa',
  TRACTOCAMIONES: 'Tractocamiones',
  GRUAS_TITANES: 'Gruas Titanes',
  GRUAS_ARTICULADAS: 'Gruas Articuladas',
  BOMBAS: 'Bombas',
  ELEVADORES: 'Elevadores',
  ROUGH_TERRAIN: 'Rough Terrain',
  ALL_TERRAIN: 'All Terrain',
  ROUGH_TERRAIN_DB: 'rough_terrain',
  ALL: 'ALL',
} as const;

export type CategoryValue = typeof CAT[keyof typeof CAT];

export const YELLOW_CATEGORIES: ReadonlyArray<string> = [
  CAT.RETROEXCAVADORAS,
  CAT.EXCAVADORAS,
  CAT.TOPADORES,
  CAT.MOTOCONFORMADORAS,
  CAT.CARGADORES,
  CAT.ELEVADORES,
];

export const TRUCK_CATEGORIES: ReadonlyArray<string> = [
  CAT.CAMIONES_VOLTEO,
  CAT.CAMIONES_TROMPO,
  CAT.CAMIONES_PIPA,
  CAT.TRACTOCAMIONES,
  CAT.GRUAS_TITANES,
];

export const CRANE_CATEGORIES: ReadonlyArray<string> = [
  CAT.GRUAS_TITANES,
  CAT.GRUAS_ARTICULADAS,
  CAT.ROUGH_TERRAIN_DB,
];

export const CHASSIS_FILTER_CATEGORIES: ReadonlyArray<string> = [
  CAT.CAMIONES_PIPA,
  CAT.CAMIONES_VOLTEO,
];

export const normalizeCategory = (cat: string): string =>
  cat === CAT.ROUGH_TERRAIN || cat === CAT.ALL_TERRAIN ? CAT.ROUGH_TERRAIN_DB : cat;
