import '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { requireAgentApiKey } from '@/lib/apiKeyAuth';
import { FIREBASE_COLLECTION, MAX_FETCH_LIMIT } from '@/constants/appConfig';
import { CAT, STATS_CATEGORIES, TRACTOCAMION_SUBTYPES } from '@/constants/machineCategories';

export const dynamic = 'force-dynamic';

const LIMIT_DEFAULT = 10;
const LIMIT_MAX     = 50;
const CACHE_TTL_MS  = 5 * 60 * 1000;

// Campos expuestos al agente. Lista blanca: nada interno (teléfono del vendedor,
// márgenes, trazabilidad ERP/MVP) sale de aquí.
interface MaquinaAgente {
  id: string;
  titulo: string;
  categoria: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  precio: number | null;           // null = "Consultar precio"
  ubicacion: string | null;
  uso_horas: number | null;
  uso_millas: number | null;
  motor: string | null;
  transmision: string | null;
  combustible: string | null;
  capacidad: string | null;
  alcance: number | null;
  imagen_principal: string | null;
  url: string | null;
  pagina: string | null;
  es_subasta: boolean;
  subasta_cierre: string | null;
  actualizado: string | null;      // ISO
}

const texto  = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const numero = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);

const fechaIso = (v: unknown): string | null => {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === 'string') return v;
  return null;
};

const aMaquinaAgente = (id: string, d: Record<string, unknown>): MaquinaAgente => ({
  id,
  titulo: texto(d.titulo) ?? '',
  categoria: texto(d.categoria_tarea) ?? '',
  marca: texto(d.marca),
  modelo: texto(d.modelo),
  anio: numero(d['año']),
  precio: numero(d.precio),
  ubicacion: texto(d.ubicacion),
  uso_horas: numero(d.uso_horas) ?? numero(d.uso),
  uso_millas: numero(d.uso_millas),
  motor: texto(d.motor),
  transmision: texto(d.transmision),
  combustible: texto(d.combustible),
  capacidad: texto(d.capacidad),
  alcance: numero(d.alcance),
  imagen_principal: Array.isArray(d.imagenes) ? texto(d.imagenes[0]) : null,
  url: texto(d.url),
  pagina: texto(d.pagina),
  es_subasta: d.es_subasta === true,
  subasta_cierre: texto(d.subasta_cierre),
  actualizado: fechaIso(d.timestamp),
});

// Caché por categoría dentro de la instancia: el agente consulta en cada
// conversación y cada lectura completa cuesta hasta MAX_FETCH_LIMIT documentos.
const cache = new Map<string, { items: MaquinaAgente[]; expira: number }>();

const cargarCategoria = async (categoria: string): Promise<MaquinaAgente[]> => {
  const hit = cache.get(categoria);
  if (hit && hit.expira > Date.now()) return hit.items;

  const col = getFirestore().collection(FIREBASE_COLLECTION);
  const base = categoria === CAT.ALL
    ? col
    : categoria === CAT.TRACTOCAMIONES
      ? col.where('categoria_tarea', 'in', [...TRACTOCAMION_SUBTYPES, CAT.TRACTOCAMIONES])
      : col.where('categoria_tarea', '==', categoria);

  const snap = await base.orderBy('timestamp', 'desc').limit(MAX_FETCH_LIMIT).get();
  const items = snap.docs.map(doc => aMaquinaAgente(doc.id, doc.data()));
  cache.set(categoria, { items, expira: Date.now() + CACHE_TTL_MS });
  return items;
};

// El agente llena los params con IA: se acepta la categoría sin importar mayúsculas.
const resolverCategoria = (raw: string | null): string | null => {
  if (!raw?.trim()) return CAT.ALL;
  const buscada = raw.trim().toLowerCase();
  return STATS_CATEGORIES.find(c => c.toLowerCase() === buscada) ?? null;
};

const entero = (raw: string | null): number | null => {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
};

const contiene = (valor: string | null, buscado: string): boolean =>
  !!valor && valor.toLowerCase().includes(buscado);

export async function GET(request: Request) {
  const guard = await requireAgentApiKey(request);
  if (!guard.ok) return guard.response;

  const params = new URL(request.url).searchParams;

  const categoria = resolverCategoria(params.get('categoria'));
  if (!categoria) {
    return NextResponse.json(
      { success: false, error: 'Categoría no válida.', categorias_validas: STATS_CATEGORIES },
      { status: 400 },
    );
  }

  const marca     = params.get('marca')?.trim().toLowerCase() ?? '';
  const modelo    = params.get('modelo')?.trim().toLowerCase() ?? '';
  const ubicacion = params.get('ubicacion')?.trim().toLowerCase() ?? '';
  const anioMin   = entero(params.get('anio_min'));
  const precioMax = entero(params.get('precio_max'));
  const limit     = Math.min(Math.max(entero(params.get('limit')) ?? LIMIT_DEFAULT, 1), LIMIT_MAX);
  const offset    = Math.max(entero(params.get('offset')) ?? 0, 0);

  try {
    const todas = await cargarCategoria(categoria);

    // Máquinas sin precio ("Consultar precio") no se descartan por precio_max.
    const filtradas = todas.filter(m =>
      (!marca     || contiene(m.marca, marca) || contiene(m.titulo, marca)) &&
      (!modelo    || contiene(m.modelo, modelo) || contiene(m.titulo, modelo)) &&
      (!ubicacion || contiene(m.ubicacion, ubicacion)) &&
      (anioMin   === null || (m.anio !== null && m.anio >= anioMin)) &&
      (precioMax === null || m.precio === null || m.precio <= precioMax),
    );

    const items = filtradas.slice(offset, offset + limit);
    return NextResponse.json({
      success: true,
      total: filtradas.length,
      count: items.length,
      offset,
      items,
    });
  } catch (err) {
    console.error('[agente] Error al consultar maquinaria', err);
    return NextResponse.json({ success: false, error: 'No se pudo obtener la maquinaria.' }, { status: 500 });
  }
}
