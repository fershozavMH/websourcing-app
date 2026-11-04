import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import '@/lib/firebase-admin';
import { requireMonitoreoAdmin } from '@/lib/monitoreo/auth';
import { writeLog } from '@/lib/monitoreo/writeLog';
import { LOG_CODES } from '@/constants/logCodes';
import { SCH_APROBADORES_COLLECTION } from '@/constants/monitoreo';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const leerEmail = async (request: Request): Promise<string | null> => {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  return EMAIL_REGEX.test(email) ? email : null;
};

// Lista de quién puede aprobar equipos para el agente SCH. Solo admins de Monitoreo.
export async function GET(request: Request) {
  const guard = await requireMonitoreoAdmin(request);
  if (!guard.ok) return guard.response;

  try {
    const snapshot = await getFirestore().collection(SCH_APROBADORES_COLLECTION).where('active', '==', true).get();
    const aprobadores = snapshot.docs.map((doc) => {
      const d = doc.data();
      return { email: d.email, addedBy: d.addedBy, active: d.active };
    });
    return NextResponse.json({ success: true, aprobadores });
  } catch (error) {
    console.error('[sch/aprobadores GET] error:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener aprobadores.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireMonitoreoAdmin(request);
  if (!guard.ok) return guard.response;

  const email = await leerEmail(request);
  if (!email) return NextResponse.json({ success: false, error: 'Correo inválido.' }, { status: 400 });

  try {
    await getFirestore().collection(SCH_APROBADORES_COLLECTION).doc(email).set({
      email,
      addedBy: guard.email,
      addedAt: FieldValue.serverTimestamp(),
      active: true,
    });
    await writeLog({
      level: 'info',
      category: 'activity',
      code: LOG_CODES.ACT_SCH_APROBADOR,
      message: `${email} agregado como aprobador SCH`,
      source: 'server',
      route: '/api/sch/aprobadores',
      userEmail: guard.email,
      metadata: { aprobador: email, accion: 'agregar' },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[sch/aprobadores POST] error:', error);
    return NextResponse.json({ success: false, error: 'Error al agregar aprobador.' }, { status: 500 });
  }
}

// Se desactiva en lugar de borrar, para conservar quién lo había dado de alta.
export async function DELETE(request: Request) {
  const guard = await requireMonitoreoAdmin(request);
  if (!guard.ok) return guard.response;

  const email = await leerEmail(request);
  if (!email) return NextResponse.json({ success: false, error: 'Correo inválido.' }, { status: 400 });

  try {
    await getFirestore().collection(SCH_APROBADORES_COLLECTION).doc(email).set(
      { active: false, removedBy: guard.email, removedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    await writeLog({
      level: 'info',
      category: 'activity',
      code: LOG_CODES.ACT_SCH_APROBADOR,
      message: `${email} retirado como aprobador SCH`,
      source: 'server',
      route: '/api/sch/aprobadores',
      userEmail: guard.email,
      metadata: { aprobador: email, accion: 'quitar' },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[sch/aprobadores DELETE] error:', error);
    return NextResponse.json({ success: false, error: 'Error al quitar aprobador.' }, { status: 500 });
  }
}
