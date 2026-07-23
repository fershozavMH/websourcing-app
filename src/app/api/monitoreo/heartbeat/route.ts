import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import '@/lib/firebase-admin';
import { verifyIdTokenFromRequest } from '@/lib/monitoreo/auth';
import { USER_PRESENCE_COLLECTION } from '@/constants/monitoreo';

// Cualquier usuario autenticado puede reportar su propia presencia — no
// requiere ser admin de monitoreo, solo confirma "sigo usando la app".
// Se usa para calcular el estado Activo/Inactivo real en el dashboard,
// en vez de depender del último login (que puede tener días de antigüedad
// aunque la sesión del navegador siga abierta).
export async function POST(request: Request) {
  const email = await verifyIdTokenFromRequest(request);
  if (!email) {
    return NextResponse.json({ success: false, error: 'No autenticado.' }, { status: 401 });
  }

  try {
    const db = getFirestore();
    await db.collection(USER_PRESENCE_COLLECTION).doc(email).set({
      email,
      lastSeenAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[monitoreo/heartbeat] error:', error);
    const message = error instanceof Error ? error.message : 'Error al registrar presencia.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
