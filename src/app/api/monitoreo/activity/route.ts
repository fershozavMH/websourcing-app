import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebase-admin';
import { requireMonitoreoAdmin } from '@/lib/monitoreo/auth';
import { SYSTEM_LOGS_COLLECTION, USER_PRESENCE_COLLECTION } from '@/constants/monitoreo';
import { FIREBASE_COLLECTION } from '@/constants/appConfig';

export async function GET(request: Request) {
  const guard = await requireMonitoreoAdmin(request);
  if (!guard.ok) return guard.response;

  // Promise.allSettled: una fuente que falle (p.ej. falta de índice compuesto
  // en Firestore para la consulta de logs) no debe tumbar las otras.
  const [userListResult, activityLogsResult, sentMachinesResult, presenceResult] = await Promise.allSettled([
    getAuth().listUsers(1000),
    getFirestore()
      .collection(SYSTEM_LOGS_COLLECTION)
      .where('category', '==', 'activity')
      .orderBy('timestamp', 'desc')
      .limit(500)
      .get(),
    getFirestore()
      .collection(FIREBASE_COLLECTION)
      .where('estado_sourcing', '==', 'enviado_erp')
      .get(),
    getFirestore().collection(USER_PRESENCE_COLLECTION).get(),
  ]);

  const errors: string[] = [];

  const presenceByEmail = new Map<string, string | null>();
  if (presenceResult.status === 'fulfilled') {
    presenceResult.value.docs.forEach((doc) => {
      const data = doc.data();
      const seconds = data.lastSeenAt?._seconds ?? data.lastSeenAt?.seconds;
      presenceByEmail.set(doc.id, seconds ? new Date(seconds * 1000).toISOString() : null);
    });
  } else {
    console.error('[monitoreo/activity] consulta de presencia falló:', presenceResult.reason);
    errors.push('No se pudo obtener la presencia en línea de los usuarios.');
  }

  let users: Array<{
    uid: string;
    email: string | null;
    lastSignInTime: string | null;
    creationTime: string | null;
    lastSeenAt: string | null;
  }> = [];
  if (userListResult.status === 'fulfilled') {
    users = userListResult.value.users.map((u) => ({
      uid: u.uid,
      email: u.email ?? null,
      lastSignInTime: u.metadata.lastSignInTime ?? null,
      creationTime: u.metadata.creationTime ?? null,
      lastSeenAt: (u.email && presenceByEmail.get(u.email.toLowerCase())) ?? null,
    }));
  } else {
    console.error('[monitoreo/activity] listUsers falló:', userListResult.reason);
    errors.push('No se pudo obtener la lista de usuarios.');
  }

  let loginActivity: Array<{ id: string; code: unknown; userEmail: unknown; timestamp: unknown }> = [];
  if (activityLogsResult.status === 'fulfilled') {
    loginActivity = activityLogsResult.value.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, code: data.code, userEmail: data.userEmail, timestamp: data.timestamp };
    });
  } else {
    console.error('[monitoreo/activity] consulta de logs falló:', activityLogsResult.reason);
    errors.push(
      'No se pudo obtener el historial de accesos (probablemente falta un índice compuesto en Firestore para system_logs: category + timestamp — revisa los logs del servidor por el enlace para crearlo).',
    );
  }

  let erpSends: Array<{ usuario: string; total: number }> = [];
  if (sentMachinesResult.status === 'fulfilled') {
    const byUser = new Map<string, number>();
    sentMachinesResult.value.docs.forEach((doc) => {
      const enviadoPor = doc.data().enviado_por || 'Desconocido';
      byUser.set(enviadoPor, (byUser.get(enviadoPor) ?? 0) + 1);
    });
    erpSends = Array.from(byUser.entries()).map(([usuario, total]) => ({ usuario, total }));
  } else {
    console.error('[monitoreo/activity] consulta de envíos ERP falló:', sentMachinesResult.reason);
    errors.push('No se pudo obtener el resumen de envíos al ERP.');
  }

  return NextResponse.json({ success: true, users, loginActivity, erpSends, errors });
}
