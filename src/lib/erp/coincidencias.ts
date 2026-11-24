// Criterios para saber si un equipo de Web Sourcing ya existe en el ERP, aunque
// se haya cargado por otra vía (a mano, otro sistema) y no lleve nuestro [ID].

export type CriterioCoincidencia = 'id' | 'url' | 'serie';

// Mínimo de caracteres alfanuméricos para considerar útil un número de serie.
// Evita falsos positivos con valores basura ("0", "N/A", "123"...).
const SERIE_MIN_LEN = 5;
const SERIES_BASURA = new Set(['NA', 'ND', 'NOAPLICA', 'UNKNOWN', 'DESCONOCIDO', 'NONE', 'NULL', 'TBD']);

export const normalizarSerie = (v: unknown): string => {
  const s = (typeof v === 'string' || typeof v === 'number' ? String(v) : '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.length >= SERIE_MIN_LEN && !SERIES_BASURA.has(s) ? s : '';
};

// "https://www.Site.com/a/b/?x=1" → "site.com/a/b". Ignora esquema, www, query,
// hash y diagonal final, para que la misma publicación coincida aunque cambie el formato.
export const normalizarUrl = (v: unknown): string => {
  if (typeof v !== 'string' || !v.trim()) return '';
  try {
    const u = new URL(v.trim());
    const ruta = u.pathname.replace(/\/+$/, '');
    if (!ruta) return ''; // solo el dominio no identifica un equipo
    return `${u.hostname.replace(/^www\./i, '')}${ruta}`.toLowerCase();
  } catch {
    return '';
  }
};

// El ERP a veces renombra el registro a "(EQUI-002545) - título"; el identificador
// estable es el código EQUI-#####.
export const codigoEqui = (v: unknown): string =>
  typeof v === 'string' ? (v.match(/EQUI-\d+/i)?.[0].toUpperCase() ?? '') : '';

export interface CoincidenciaErp {
  name: string;
  criterio: CriterioCoincidencia;
}

interface FilaErp {
  name: string;
  nombre?: string | null;
  enlace_web_sourcing_live?: string | null;
  numero_de_serie?: string | null;
}

const PRIORIDAD: CriterioCoincidencia[] = ['id', 'url', 'serie'];

// Busca en el ERP un equipo equivalente por [ID] en el nombre, URL de la publicación o
// número de serie. Las búsquedas `like` del ERP se confirman aquí con comparación
// normalizada exacta para no dar falsos positivos (p. ej. una URL que es prefijo de otra).
export async function buscarEquipoEnErp(
  equipo: { id?: string; url?: unknown; numeroSerie?: unknown },
  conexion: { apiUrl: string; authHeader: string },
): Promise<CoincidenciaErp | null> {
  const id = equipo.id?.trim() ?? '';
  const url = normalizarUrl(equipo.url);
  const serie = normalizarSerie(equipo.numeroSerie);
  const serieCruda = typeof equipo.numeroSerie === 'string' ? equipo.numeroSerie.trim() : String(equipo.numeroSerie ?? '').trim();

  const orFiltros: unknown[][] = [];
  if (id) orFiltros.push(['nombre', 'like', `%[${id}]`]);
  if (url) orFiltros.push(['enlace_web_sourcing_live', 'like', `%${url.slice(url.indexOf('/') + 1)}%`]);
  if (serie) {
    orFiltros.push(['numero_de_serie', 'like', `%${serieCruda}%`]);
    // Por si en el ERP se escribió sin guiones/espacios y aquí viene con ellos.
    if (serie !== serieCruda) orFiltros.push(['numero_de_serie', 'like', `%${serie}%`]);
  }
  if (orFiltros.length === 0) return null;

  const params = new URLSearchParams({
    or_filters: JSON.stringify(orFiltros),
    fields: JSON.stringify(['name', 'nombre', 'enlace_web_sourcing_live', 'numero_de_serie']),
    limit_page_length: '50',
  });
  const res = await fetch(`${conexion.apiUrl}?${params}`, {
    headers: { Authorization: conexion.authHeader, Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`El ERP respondió ${res.status} al buscar duplicados: ${(await res.text()).slice(0, 200)}`);
  const filas: FilaErp[] = (await res.json())?.data ?? [];

  const encontrados = new Map<CriterioCoincidencia, string>();
  for (const f of filas) {
    if (id && typeof f.nombre === 'string' && f.nombre.trim().endsWith(`[${id}]`) && !encontrados.has('id')) encontrados.set('id', f.name);
    if (url && normalizarUrl(f.enlace_web_sourcing_live) === url && !encontrados.has('url')) encontrados.set('url', f.name);
    if (serie && normalizarSerie(f.numero_de_serie) === serie && !encontrados.has('serie')) encontrados.set('serie', f.name);
  }
  for (const criterio of PRIORIDAD) {
    const name = encontrados.get(criterio);
    if (name) return { name, criterio };
  }
  return null;
}
