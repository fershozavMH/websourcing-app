import '@/lib/firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { SCH_APROBACIONES_COLLECTION, SCH_APROBADORES_COLLECTION } from '@/constants/monitoreo';

export interface AprobacionSch {
  aprobadoPor: string;
  aprobadoEmail: string;
  aprobadoEn: string;   // ISO
  venceEn: string;      // ISO
}

export async function isSchAprobador(email: string): Promise<boolean> {
  const doc = await getFirestore().collection(SCH_APROBADORES_COLLECTION).doc(email.toLowerCase()).get();
  return doc.exists && doc.data()?.active === true;
}

const iso = (v: unknown): string => (v instanceof Timestamp ? v.toDate().toISOString() : '');

// Caché corta: quitar una aprobación debe reflejarse en el agente en menos de un
// minuto aunque la petición caiga en otra instancia.
const CACHE_TTL_MS = 60 * 1000;
let cache: { vigentes: Map<string, AprobacionSch>; expira: number } | null = null;

export function invalidarAprobacionesSch(): void {
  cache = null;
}

// Solo las aprobaciones que no han vencido; las vencidas cuentan como no aprobadas.
export async function cargarAprobacionesVigentes(): Promise<Map<string, AprobacionSch>> {
  if (cache && cache.expira > Date.now()) return cache.vigentes;

  const snap = await getFirestore()
    .collection(SCH_APROBACIONES_COLLECTION)
    .where('venceEn', '>', Timestamp.now())
    .get();

  const vigentes = new Map<string, AprobacionSch>();
  for (const doc of snap.docs) {
    const d = doc.data();
    vigentes.set(doc.id, {
      aprobadoPor: typeof d.aprobadoPor === 'string' ? d.aprobadoPor : '',
      aprobadoEmail: typeof d.aprobadoEmail === 'string' ? d.aprobadoEmail : '',
      aprobadoEn: iso(d.aprobadoEn),
      venceEn: iso(d.venceEn),
    });
  }
  cache = { vigentes, expira: Date.now() + CACHE_TTL_MS };
  return vigentes;
}
