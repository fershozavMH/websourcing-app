import '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { FIREBASE_COLLECTION } from '@/constants/appConfig';
import { codigoEqui, normalizarSerie, normalizarUrl, type CriterioCoincidencia } from '@/lib/erp/coincidencias';

const BATCH_SIZE = 400;

export interface EnviadoSincronizado {
  id: string;
  criterio: CriterioCoincidencia;
  referencia: string; // serie o URL con la que coincidió
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
  erpConUrl: number;
  revisados: number;
  yaMarcados: number;
  marcados: EnviadoSincronizado[];
  huerfanos: HuerfanoErp[];
}

interface EquipoErp {
  name: string;
  nombre?: string | null;
  numero_de_serie?: string | null;
  enlace_web_sourcing_live?: string | null;
}

async function leerEquiposErp(): Promise<EquipoErp[]> {
  const apiUrl = process.env.ERP_API_URL;
  const key = process.env.ERP_API_KEY;
  const secret = process.env.ERP_API_SECRET;
  if (!apiUrl || !key || !secret) throw new Error('Faltan las variables de entorno del ERP.');

  const fields = encodeURIComponent(JSON.stringify(['name', 'nombre', 'numero_de_serie', 'enlace_web_sourcing_live']));
  const res = await fetch(`${apiUrl}?fields=${fields}&limit_page_length=0`, {
    headers: { Authorization: `token ${key}:${secret}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`El ERP respondió ${res.status} al listar equipos: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  if (!Array.isArray(json?.data)) throw new Error('Respuesta inesperada del ERP al listar equipos.');
  return json.data as EquipoErp[];
}

// Marca como "enviado al ERP" los equipos de Web Sourcing que ya existen en el ERP
// aunque se hayan cargado por otra vía: coincide por [ID] en el nombre, URL de la
// publicación o número de serie. No desmarca nada: los equipos marcados cuyo
// registro ya no aparece en el ERP solo se reportan.
export async function sincronizarEnviadosErp(): Promise<ResultadoSyncErp> {
  const equiposErp = await leerEquiposErp();

  const porSerie = new Map<string, string>();
  const porUrl = new Map<string, string>();
  const porIdEnNombre = new Map<string, string>();
  const codigosErp = new Set<string>();
  for (const e of equiposErp) {
    const codigo = codigoEqui(e.name);
    if (codigo) codigosErp.add(codigo);
    const referencia = codigo || e.name;
    const serie = normalizarSerie(e.numero_de_serie);
    if (serie && !porSerie.has(serie)) porSerie.set(serie, referencia);
    const url = normalizarUrl(e.enlace_web_sourcing_live);
    if (url && !porUrl.has(url)) porUrl.set(url, referencia);
    const idNombre = typeof e.nombre === 'string' ? e.nombre.trim().match(/\[([^\]]+)\]$/)?.[1] : undefined;
    if (idNombre && !porIdEnNombre.has(idNombre)) porIdEnNombre.set(idNombre, referencia);
  }

  const db = getFirestore();
  const snap = await db.collection(FIREBASE_COLLECTION).select('numero_serie', 'url', 'estado_sourcing', 'id_erp').get();

  const ahora = new Date().toISOString();
  const marcados: EnviadoSincronizado[] = [];
  const huerfanos: HuerfanoErp[] = [];
  let yaMarcados = 0;
  const pendientes: { ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown> }[] = [];

  for (const doc of snap.docs) {
    const d = doc.data();
    const serie = normalizarSerie(d.numero_serie);
    const url = normalizarUrl(d.url);
    const marcado = d.estado_sourcing === 'enviado_erp' || !!d.id_erp;

    if (marcado) {
      yaMarcados++;
      const codigo = codigoEqui(d.id_erp);
      const enErp = (codigo && codigosErp.has(codigo)) || porIdEnNombre.has(doc.id) || (url && porUrl.has(url)) || (serie && porSerie.has(serie));
      if (!enErp) huerfanos.push({ id: doc.id, id_erp: String(d.id_erp ?? ''), serie: String(d.numero_serie ?? '') });
      continue;
    }

    let criterio: CriterioCoincidencia | null = null;
    let idErp: string | undefined;
    let referencia = '';
    if (porIdEnNombre.has(doc.id)) {
      criterio = 'id'; idErp = porIdEnNombre.get(doc.id); referencia = doc.id;
    } else if (url && porUrl.has(url)) {
      criterio = 'url'; idErp = porUrl.get(url); referencia = String(d.url);
    } else if (serie && porSerie.has(serie)) {
      criterio = 'serie'; idErp = porSerie.get(serie); referencia = String(d.numero_serie);
    }
    if (!criterio || !idErp) continue;

    marcados.push({ id: doc.id, criterio, referencia, id_erp: idErp });
    // Sin fecha_envio_erp ni enviado_por a propósito: esos campos alimentan la
    // productividad por usuario y esta marca no la hizo ninguna persona.
    pendientes.push({
      ref: doc.ref,
      data: { estado_sourcing: 'enviado_erp', id_erp: idErp, sincronizado_erp_en: ahora, sincronizado_erp_por: criterio },
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
    erpConUrl: porUrl.size,
    revisados: snap.size,
    yaMarcados,
    marcados,
    huerfanos,
  };
}
