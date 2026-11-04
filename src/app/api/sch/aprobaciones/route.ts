import '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { requireAuthenticatedUser } from '@/lib/apiAuth';
import { getClientIp } from '@/lib/monitoreo/auth';
import { writeLog } from '@/lib/monitoreo/writeLog';
import { LOG_CODES } from '@/constants/logCodes';
import { FIREBASE_COLLECTION } from '@/constants/appConfig';
import { SCH_APROBACIONES_COLLECTION, SCH_APROBACION_DIAS } from '@/constants/monitoreo';
import { cargarAprobacionesVigentes, invalidarAprobacionesSch, isSchAprobador } from '@/lib/sch/aprobaciones';

export const dynamic = 'force-dynamic';

// Aprobaciones vigentes para pintar las tarjetas, y si el usuario puede aprobar.
// Cualquier usuario logueado puede ver qué está aprobado; solo aprobadores lo cambian.
export async function GET(request: Request) {
  const guard = await requireAuthenticatedUser(request);
  if (!guard.ok) return guard.response;

  try {
    const [vigentes, puedeAprobar] = await Promise.all([
      cargarAprobacionesVigentes(),
      isSchAprobador(guard.email),
    ]);
    return NextResponse.json({ success: true, puedeAprobar, aprobaciones: Object.fromEntries(vigentes) });
  } catch (error) {
    console.error('[sch/aprobaciones GET] error:', error);
    return NextResponse.json({ success: false, error: 'No se pudieron obtener las aprobaciones.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireAuthenticatedUser(request);
  if (!guard.ok) return guard.response;

  if (!(await isSchAprobador(guard.email))) {
    await writeLog({
      level: 'security',
      category: 'security',
      code: LOG_CODES.SEC_UNAUTHORIZED_ACCESS,
      message: `Usuario sin permiso de aprobador SCH intentó cambiar una aprobación`,
      source: 'server',
      route: '/api/sch/aprobaciones',
      userEmail: guard.email,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? undefined,
    });
    return NextResponse.json({ success: false, error: 'No tienes permiso para aprobar equipos.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const docId = typeof body?.docId === 'string' ? body.docId : '';
  const accion = body?.accion;
  if (!docId || (accion !== 'aprobar' && accion !== 'quitar')) {
    return NextResponse.json({ success: false, error: 'Solicitud inválida.' }, { status: 400 });
  }

  try {
    const db = getFirestore();
    const maquina = await db.collection(FIREBASE_COLLECTION).doc(docId).get();
    if (!maquina.exists) {
      return NextResponse.json({ success: false, error: 'Equipo no encontrado.' }, { status: 404 });
    }

    const ref = db.collection(SCH_APROBACIONES_COLLECTION).doc(docId);

    if (accion === 'quitar') {
      await ref.delete();
      invalidarAprobacionesSch();
      await writeLog({
        level: 'info',
        category: 'activity',
        code: LOG_CODES.ACT_SCH_QUITAR,
        message: `Aprobación SCH retirada por ${guard.name}`,
        source: 'server',
        route: '/api/sch/aprobaciones',
        userEmail: guard.email,
        metadata: { machineId: docId },
      });
      return NextResponse.json({ success: true, aprobacion: null });
    }

    // Aprobar de nuevo renueva el plazo.
    const ahora = new Date();
    const vence = new Date(ahora.getTime() + SCH_APROBACION_DIAS * 24 * 60 * 60 * 1000);
    await ref.set({
      aprobadoPor: guard.name,
      aprobadoEmail: guard.email,
      aprobadoEn: Timestamp.fromDate(ahora),
      venceEn: Timestamp.fromDate(vence),
    });
    invalidarAprobacionesSch();
    await writeLog({
      level: 'info',
      category: 'activity',
      code: LOG_CODES.ACT_SCH_APROBAR,
      message: `Equipo aprobado para el agente SCH por ${guard.name}`,
      source: 'server',
      route: '/api/sch/aprobaciones',
      userEmail: guard.email,
      metadata: { machineId: docId, venceEn: vence.toISOString() },
    });

    return NextResponse.json({
      success: true,
      aprobacion: {
        aprobadoPor: guard.name,
        aprobadoEmail: guard.email,
        aprobadoEn: ahora.toISOString(),
        venceEn: vence.toISOString(),
      },
    });
  } catch (error) {
    console.error('[sch/aprobaciones POST] error:', error);
    return NextResponse.json({ success: false, error: 'No se pudo guardar la aprobación.' }, { status: 500 });
  }
}
