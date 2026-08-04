// Diccionario completo de abreviaturas de los 50 estados de EE. UU.
const US_STATE_ABBR: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

const normalizarEstado = (raw: string): string => {
  const limpio = raw.trim();
  if (!limpio) return '';
  const abbr = limpio.toUpperCase();
  return US_STATE_ABBR[abbr] ?? limpio;
};

const extractCiudad = (ubicacion: string): string => {
  if (!ubicacion) return '';
  return ubicacion.split(',')[0].trim();
};

const extractEstado = (ubicacion: string): string => {
  if (!ubicacion) return '';
  const partes = ubicacion.split(',');
  if (partes.length < 2) return '';
  return normalizarEstado(partes[1]);
};

const TECHNICAL_SPECS_MAP: Array<[string, string]> = [
  ['motor', 'engine'],
  ['transmision', 'transmission'],
  ['capacidad', 'capacity'],
  ['alcance', 'boomLength'],
  ['uso_millas', 'mileage'],
  ['combustible', 'fuelType'],
];

// Mapea categoria_tarea (interno) → { category, subcategory } del catálogo MVP
const CATEGORY_MVP_MAP: Record<string, { category: string; subcategory: string }> = {
  'Excavadoras':        { category: 'Maquinaria pesada', subcategory: 'Excavadora' },
  'Retroexcavadoras':   { category: 'Retroexcavadora',   subcategory: 'Retroexcavadoras' },
  'Topadores':          { category: 'Maquinaria pesada', subcategory: 'Topador Frontal' },
  'Cargadores':         { category: 'Maquinaria pesada', subcategory: 'Cargador Frontal' },
  'Motoconformadoras':  { category: 'Maquinaria pesada', subcategory: 'Motoconformadora' },
  'Compactadoras':      { category: 'Maquinaria pesada', subcategory: 'Vibrocompactador' },
  'Camiones Volteo':    { category: 'Camiones',          subcategory: 'Camión de Volteo' },
  'Camiones Trompo':    { category: 'Concretos',         subcategory: 'Trompo Revolvedor' },
  'Camiones Pipa':      { category: 'Equipo ligero',     subcategory: 'Pipa de agua' },
  'Tractocamiones':     { category: 'Camiones',          subcategory: 'Camión Chasis' },
  'Sleeper':            { category: 'Camiones',          subcategory: 'Camión Chasis' },
  'Day cab':            { category: 'Camiones',          subcategory: 'Camión Chasis' },
  'Gruas Titanes':      { category: 'Gruas',             subcategory: 'Grúa Titán' },
  'Gruas Articuladas':  { category: 'Gruas',             subcategory: 'Grúa Articulada' },
  'Rough Terrain':      { category: 'Gruas',             subcategory: 'Grúa RT' },
  'All Terrain':        { category: 'Gruas',             subcategory: 'Grúa Todo Terreno' },
  'Bombas':             { category: 'Concretos',         subcategory: 'Bomba de Concreto' },
};

const mapCategoriaElevador = (subtipoElevador?: string): { category: string; subcategory: string } => {
  const subtipo = (subtipoElevador || '').toUpperCase();
  if (subtipo.includes('TELESCOPICO')) {
    return { category: 'Elevacion', subcategory: 'Manipulador Telescópico' };
  }
  return { category: 'Elevacion', subcategory: 'Elevador' };
};

const mapCategoriaMvp = (doc: Record<string, any>): { category: string; subcategory: string } => {
  const cat = doc.categoria_tarea;
  if (cat === 'Elevadores') return mapCategoriaElevador(doc.subtipo_elevador);
  return CATEGORY_MVP_MAP[cat] ?? { category: doc.categoria_tarea, subcategory: doc.origen_tarea };
};

const FEATURES_MAP: Array<[string, string]> = [
  ['tiene_cabina', 'Cabina'],
  ['tiene_martillo', 'Martillo hidráulico'],
  ['tiene_extension', 'Extensión de pluma'],
  ['es_4x4', '4x4'],
  ['tiene_almeja', 'Almeja'],
  ['tiene_ripper', 'Ripper'],
];

export function mapToMhApi(docId: string, doc: Record<string, any>): Record<string, any> {
  const technicalSpecs: Record<string, any> = {};
  for (const [origen, destino] of TECHNICAL_SPECS_MAP) {
    if (doc[origen] !== undefined && doc[origen] !== null) {
      technicalSpecs[destino] = doc[origen];
    }
  }

  const features = FEATURES_MAP
    .filter(([campo]) => doc[campo] === true)
    .map(([, label]) => label);

  const { category, subcategory } = mapCategoriaMvp(doc);

  const payload: Record<string, any> = {
    externalId: docId,
    source: 'WEBSOURCING',
    originalUrl: doc.url,
    title: doc.titulo,
    category,
    subcategory,
    make: doc.marca,
    model: doc.modelo,
    year: doc.año,
    hours: doc.uso_horas,
    serialNumber: doc.numero_serie,
    priceUsd: doc.precio,
    currency: 'USD',
    condition: 'Usado',
    status: 'DISPONIBLE',
    isAvailable: true,
    isPublished: false,
    location: doc.ubicacion,
    country: 'US',
    state: extractEstado(doc.ubicacion),
    city: extractCiudad(doc.ubicacion),
    images: doc.imagenes ?? [],
    videos: [],
    documents: [],
    sellerContact: doc.telefono_vendedor,
    isAuction: doc.es_subasta ?? false,
    lastSyncedAt: new Date().toISOString(),
    ...(Object.keys(technicalSpecs).length > 0 && { technicalSpecs }),
    features,
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== null && value !== undefined)
  );
}
