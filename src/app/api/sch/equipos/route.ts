import '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { requireAgentApiKey } from '@/lib/apiKeyAuth';
import { FIREBASE_COLLECTION } from '@/constants/appConfig';
import { resolverTipoEquipo, tipoDeEquipo, montajeDeBomba, SLUGS_VALIDOS, type TipoEquipo } from '@/lib/sch/tiposEquipo';
import { parseCapacidad, esCapacidadCompatible, type Capacidad } from '@/lib/sch/capacidad';
import { parseUbicacion, type Ubicacion } from '@/lib/sch/ubicacion';
import { cargarAprobacionesVigentes } from '@/lib/sch/aprobaciones';

export const dynamic = 'force-dynamic';

const ESTADOS_PRIORITARIOS_DEFAULT = ['AZ', 'CA', 'CO', 'NV', 'NM', 'TX'];
const LIMITE_DEFAULT = 3;
const LIMITE_MAX     = 10;
const CACHE_TTL_MS   = 5 * 60 * 1000;
// Charset explícito: hay clientes que sin él decodifican los acentos como Latin-1.
const JSON_HEADERS   = { 'Content-Type': 'application/json; charset=utf-8' };

// Lo único que el agente recibe de cada equipo. Lista blanca: costos (precio,
// precio_maximo), datos del proveedor (url, pagina, titulo, teléfono, fotos
// scrapeadas) y trazabilidad interna nunca salen del servidor.
interface EquipoSch {
  id_equipo: string;
  tipo_equipo: string;
  tipo_equipo_nombre: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  capacidad: string | null;
  capacidad_valor: number | null;
  capacidad_unidad: string | null;
  ubicacion_ciudad: string | null;
  ubicacion_estado: string | null;
  ubicacion_pais: string | null;
  aprobado_para_mostrar: boolean;
  estado_validacion: 'aprobado' | 'pendiente_validacion';
  url_publica: string | null;
  imagen_publica: string | null;
}

interface Registro {
  id: string;
  categoria: string;
  titulo: string;
  data: Record<string, unknown>;
  capacidad: Capacidad | null;
  ubicacion: Ubicacion;
  recencia: number;
}

type RegistroEvaluado = Registro & { aprobado: boolean };

const texto = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

const recenciaDe = (v: unknown): number => {
  if (v instanceof Timestamp) return v.toMillis();
  if (typeof v === 'string') return Date.parse(v) || 0;
  return 0;
};

// Caché por grupo de categorías dentro de la instancia: el agente consulta en
// cada conversación y no hace falta releer Firestore en cada llamada.
const cache = new Map<string, { registros: Registro[]; expira: number }>();

const cargarRegistros = async (categorias: ReadonlyArray<string>): Promise<Registro[]> => {
  const clave = categorias.join('|');
  const hit = cache.get(clave);
  if (hit && hit.expira > Date.now()) return hit.registros;

  const snap = await getFirestore()
    .collection(FIREBASE_COLLECTION)
    .where('categoria_tarea', 'in', [...categorias])
    .get();

  const registros = snap.docs.map((doc): Registro => {
    const data = doc.data();
    return {
      id: doc.id,
      categoria: texto(data.categoria_tarea) ?? '',
      titulo: texto(data.titulo) ?? '',
      data,
      capacidad: parseCapacidad(data.capacidad),
      ubicacion: parseUbicacion(data.ubicacion),
      recencia: recenciaDe(data.timestamp),
    };
  });
  cache.set(clave, { registros, expira: Date.now() + CACHE_TTL_MS });
  return registros;
};

const aEquipoSch = (r: RegistroEvaluado, tipoBuscado: TipoEquipo): EquipoSch => {
  const tipo = tipoDeEquipo(r.categoria, r.titulo) ?? tipoBuscado;
  const anio = r.data['año'];
  return {
    id_equipo: r.id,
    tipo_equipo: tipo.slug,
    tipo_equipo_nombre: tipo.nombre,
    marca: texto(r.data.marca) ?? texto(r.data.marca_pluma),
    modelo: texto(r.data.modelo),
    anio: typeof anio === 'number' && anio > 0 ? anio : null,
    capacidad: texto(r.data.capacidad),
    capacidad_valor: r.capacidad?.valor ?? null,
    capacidad_unidad: r.capacidad?.unidad ?? null,
    ubicacion_ciudad: r.ubicacion.ciudad,
    ubicacion_estado: r.ubicacion.estado,
    ubicacion_pais: r.ubicacion.pais,
    aprobado_para_mostrar: r.aprobado,
    estado_validacion: r.aprobado ? 'aprobado' : 'pendiente_validacion',
    url_publica: null,
    imagen_publica: null,
  };
};

const MENSAJES = {
  resultados: 'Equipos compatibles encontrados. Presenta solo los que tengan aprobado_para_mostrar = true; los pendientes no deben ofrecerse como disponibles.',
  pendiente_validacion: 'Hay equipos compatibles, pero ninguno está validado para ofrecerse. Informa que el equipo comercial confirmará disponibilidad.',
  sin_resultados: 'No hay equipos compatibles. Informa que el equipo comercial revisará otras alternativas.',
} as const;

const errorSch = (mensaje: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ status: 'error', mensaje, equipos: [], ...extra }, { status, headers: JSON_HEADERS });

// El scraper a veces guarda la misma publicación más de una vez; no se ofrecen
// dos "opciones" que son el mismo equipo. Se conserva la primera (ya ordenada).
const sinDuplicados = (registros: RegistroEvaluado[]): RegistroEvaluado[] => {
  const vistos = new Set<string>();
  return registros.filter(r => {
    const d = r.data;
    const clave = [r.categoria, d.marca, d.modelo, d['año'], d.ubicacion, d.capacidad].join('|').toLowerCase();
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
};

const parseEstados = (raw: string | null): Set<string> => {
  const estados = (raw ?? '').split(',').map(s => s.trim().toUpperCase()).filter(s => /^[A-Z]{2}$/.test(s));
  return new Set(estados.length ? estados : ESTADOS_PRIORITARIOS_DEFAULT);
};

export async function GET(request: Request) {
  const guard = await requireAgentApiKey(request);
  if (!guard.ok) return guard.response;

  const params = new URL(request.url).searchParams;

  const tipo = resolverTipoEquipo(params.get('tipo_equipo'));
  if (!tipo) {
    return errorSch('tipo_equipo no reconocido.', 400, { tipos_validos: SLUGS_VALIDOS });
  }

  const capacidadRaw = params.get('capacidad')?.trim();
  const capacidadReq = capacidadRaw ? Number(capacidadRaw.replace(',', '.')) : null;
  if (capacidadReq !== null && !(Number.isFinite(capacidadReq) && capacidadReq > 0)) {
    return errorSch('capacidad debe ser un número mayor a 0.', 400);
  }

  const prioritarios = parseEstados(params.get('estados_prioritarios'));
  const limiteRaw = Number.parseInt(params.get('limite') ?? '', 10);
  const limite = Math.min(Math.max(Number.isFinite(limiteRaw) ? limiteRaw : LIMITE_DEFAULT, 1), LIMITE_MAX);

  // Solo se filtra por capacidad en categorías que la registran con una unidad conocida.
  const capacidadAplicada = capacidadReq !== null && tipo.unidad !== null;

  try {
    const [registros, aprobaciones] = await Promise.all([
      cargarRegistros(tipo.categorias),
      cargarAprobacionesVigentes(),
    ]);

    const compatibles = registros
      .filter(r =>
        (!tipo.montajeBomba || montajeDeBomba(r.titulo) === tipo.montajeBomba) &&
        (!capacidadAplicada || esCapacidadCompatible(r.capacidad, capacidadReq!, tipo.unidad!)) &&
        // Solo Estados Unidos y con un estado identificable
        r.ubicacion.pais === 'USA' && r.ubicacion.estado !== null,
      )
      // Aprobado = alguien autorizado lo aprobó para el agente y no ha vencido
      .map((r): RegistroEvaluado => ({ ...r, aprobado: aprobaciones.has(r.id) }));

    const ordenar = (a: RegistroEvaluado, b: RegistroEvaluado) =>
      Number(b.aprobado) - Number(a.aprobado) ||
      (capacidadAplicada ? (a.capacidad!.valor - b.capacidad!.valor) : 0) ||
      b.recencia - a.recencia;

    const enPrioritarios = compatibles.filter(r => prioritarios.has(r.ubicacion.estado!)).sort(ordenar);
    const enOtrosEstados = compatibles.filter(r => !prioritarios.has(r.ubicacion.estado!)).sort(ordenar);

    // La prioridad geográfica nunca sustituye la compatibilidad: otros estados solo completan.
    const unicos = sinDuplicados([...enPrioritarios, ...enOtrosEstados]);
    const seleccion = unicos.slice(0, limite);
    const equipos = seleccion.map(r => aEquipoSch(r, tipo));

    const status = equipos.length === 0
      ? 'sin_resultados'
      : equipos.some(e => e.aprobado_para_mostrar) ? 'resultados' : 'pendiente_validacion';

    return NextResponse.json({
      status,
      mensaje: MENSAJES[status],
      tipo_equipo: tipo.slug,
      capacidad_solicitada: capacidadReq,
      capacidad_unidad: tipo.unidad,
      capacidad_aplicada: capacidadAplicada,
      busqueda_ampliada: seleccion.some(r => !prioritarios.has(r.ubicacion.estado!)),
      total_encontrados: unicos.length,
      equipos,
    }, { headers: JSON_HEADERS });
  } catch (err) {
    console.error('[sch] Error al consultar equipos', err);
    return errorSch('No se pudo consultar Web Sourcing. No presentes equipos; informa que el equipo comercial dará seguimiento.', 500);
  }
}
