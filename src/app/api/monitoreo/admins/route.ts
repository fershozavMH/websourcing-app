import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import '@/lib/firebase-admin';
import { requireMonitoreoAdmin } from '@/lib/monitoreo/auth';
import { MONITOREO_ADMINS_COLLECTION } from '@/constants/monitoreo';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Doblemente sirve como self-check: un 200 aquí prueba que el llamante es admin.
export async function GET(request: Request) {
  const guard = await requireMonitoreoAdmin(request);
  if (!guard.ok) return guard.response;

  try {
    const db = getFirestore();
    const snapshot = await db.collection(MONITOREO_ADMINS_COLLECTION).get();
    const admins = snapshot.docs.map((doc) => doc.data());

    return NextResponse.json({ success: true, admins });
  } catch (error: any) {
    console.error('[monitoreo/admins GET] error:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error al obtener administradores.' },
      { status: 500 },
    );
  }
}

// Solo un admin existente puede agregar otro — no hay auto-registro.
export async function POST(request: Request) {
  const guard = await requireMonitoreoAdmin(request);
  if (!guard.ok) return guard.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ success: false, error: 'Correo inválido.' }, { status: 400 });
  }

  try {
    const db = getFirestore();
    await db.collection(MONITOREO_ADMINS_COLLECTION).doc(email).set({
      email,
      addedBy: guard.email,
      addedAt: FieldValue.serverTimestamp(),
      active: true,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[monitoreo/admins POST] error:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error al agregar administrador.' },
      { status: 500 },
    );
  }
}
