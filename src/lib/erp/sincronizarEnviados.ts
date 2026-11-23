import '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { FIREBASE_COLLECTION } from '@/constants/appConfig';

// Mínimo de caracteres alfanuméricos para considerar útil un número de serie.
// Evita falsos positivos con valores basura ("0", "N/A", "123"...).
const SERIE_MIN_LEN = 5;
const SERIES_BASURA = new Set(['NA', 'ND', 'NOAPLICA', 'UNKNOWN', 'DESCONOCIDO', 'NONE', 'NULL', 'TBD']);
const BATCH_SIZE = 400;

export interface EnviadoSincronizado {
  id: string;
  serie: string;
  id_erp: string;
}

export interface HuerfanoErp {
  id: string;
  id_erp: string;
  serie: string;
}

export interface ResultadoSyncErp {
  erpTotal: number;
  erpConSerie: number;
  revisados: number;
  yaMarcados: number;
  marcados: EnviadoSincronizado[];
  huerfanos: HuerfanoErp[];
}

interface EquipoErp {
  name: string;
  numero_de_serie?: string | null;
}

export const normalizarSerie = (v: unknown): string => {
  const s = (typeof v === 'string' || typeof v === 'number' ? String(v) : '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.length >= SERIE_MIN_LEN && !SERIES_BASURA.has(s) ? s : '';
};

// El ERP a veces renombra el registro a "(EQUI-002545) - título"; el identificador
// estable es el código EQUI-#####.
const codigoEqui = (v: unknown): string => (typeof v === 'string' ? v.match(/EQUI-\d+/i)?.[0].toUpperCase() ?? '' : '');

async function leerEquiposErp(): Promise<EquipoErp[]> {
  const apiUrl = process.env.ERP_API_URL;
  const key = process.env.ERP_API_KEY;
  const secret = process.env.ERP_API_SECRET;
  if (!apiUrl || !key || !secret) throw new Error('Faltan las variables de entorno del ERP.');

  const fields = encodeURIComponent(JSON.stringify(['name', 'numero_de_serie']));
  const res = await fetch(`${apiUrl}?fields=${fields}&limit_page_length=0`, {
    headers: { Authorization: `token ${key}:${secret}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`El ERP respondió ${res.status} al listar equipos: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  if (!Array.isArray(json?.data)) throw new Error('Respuesta inesperada del ERP al listar equipos.');
  return json.data as EquipoErp[];
}

// Marca como "enviado al ERP" los equipos de Web Sourcing cuyo número de serie ya
// existe en el ERP (aunque se hayan cargado por otra vía). No desmarca nada: los
// equipos marcados cuyo registro ya no aparece en el ERP solo se reportan.
export async function sincronizarEnviadosErp(): Promise<ResultadoSyncErp> {
  const equiposErp = await leerEquiposErp();

  const porSerie = new Map<string, string>();
  const codigosErp = new Set<string>();
  for (const e of equiposErp) {
    const codigo = codigoEqui(e.name);
    if (codigo) codigosErp.add(codigo);
    const serie = normalizarSerie(e.numero_de_serie);
    if (serie && !porSerie.has(serie)) porSerie.set(serie, codigo || e.name);
  }

  const db = getFirestore();
  const snap = await db.collection(FIREBASE_COLLECTION).select('numero_serie', 'estado_sourcing', 'id_erp').get();

  const ahora = new Date().toISOString();
  const marcados: EnviadoSincronizado[] = [];
  const huerfanos: HuerfanoErp[] = [];
  let yaMarcados = 0;
  const pendientes: { ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown> }[] = [];

  for (const doc of snap.docs) {
    const d = doc.data();
    const serie = normalizarSerie(d.numero_serie);
    const marcado = d.estado_sourcing === 'enviado_erp' || !!d.id_erp;

    if (marcado) {
      yaMarcados++;
      const codigo = codigoEqui(d.id_erp);
      const enErp = (codigo && codigosErp.has(codigo)) || (serie && porSerie.has(serie));
      if (!enErp) huerfanos.push({ id: doc.id, id_erp: String(d.id_erp ?? ''), serie: String(d.numero_serie ?? '') });
      continue;
    }

    if (!serie) continue;
    const idErp = porSerie.get(serie);
    if (!idErp) continue;

    marcados.push({ id: doc.id, serie: String(d.numero_serie), id_erp: idErp });
    // Sin fecha_envio_erp ni enviado_por a propósito: esos campos alimentan la
    // productividad por usuario y esta marca no la hizo ninguna persona.
    pendientes.push({
      ref: doc.ref,
      data: { estado_sourcing: 'enviado_erp', id_erp: idErp, sincronizado_erp_en: ahora },
    });
  }

  for (let i = 0; i < pendientes.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const p of pendientes.slice(i, i + BATCH_SIZE)) batch.update(p.ref, p.data);
    await batch.commit();
  }

  return {
    erpTotal: equiposErp.length,
    erpConSerie: porSerie.size,
    revisados: snap.size,
    yaMarcados,
    marcados,
    huerfanos,
  };
}
