import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { requireMonitoreoAdmin } from '@/lib/monitoreo/auth';
import { writeLog } from '@/lib/monitoreo/writeLog';
import { LOG_CODES } from '@/constants/logCodes';
import { sincronizarEnviadosErp } from '@/lib/erp/sincronizarEnviados';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const ROUTE = '/api/erp/sync';

const cronAutorizado = (request: Request): boolean => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const recibido = Buffer.from(request.headers.get('authorization') ?? '');
  const esperado = Buffer.from(`Bearer ${secret}`);
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
};

async function ejecutar(origen: string, userEmail?: string) {
  try {
    const r = await sincronizarEnviadosErp();
    await writeLog({
      level: 'info',
      category: 'activity',
      code: LOG_CODES.ACT_ERP_SYNC,
      message: `Sincronización con ERP (${origen}): ${r.marcados.length} equipos marcados, ${r.huerfanos.length} marcados sin registro en el ERP`,
      source: 'server',
      route: ROUTE,
      userEmail,
      metadata: { origen, erpTotal: r.erpTotal, revisados: r.revisados, marcados: r.marcados.length, huerfanos: r.huerfanos.length },
    });
    return NextResponse.json({ success: true, ...r });
  } catch (error: any) {
    await writeLog({
      level: 'error',
      category: 'error',
      code: LOG_CODES.ERR_ERP_SYNC,
      message: error?.message ?? 'Error al sincronizar con el ERP',
      stack: error?.stack,
      source: 'server',
      route: ROUTE,
      userEmail,
      metadata: { origen },
    });
    return NextResponse.json({ success: false, error: 'No se pudo sincronizar con el ERP. El detalle quedó en los logs.' }, { status: 500 });
  }
}

// Vercel Cron llama con GET y `Authorization: Bearer $CRON_SECRET`.
export async function GET(request: Request) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 });
  }
  return ejecutar('cron');
}

// Botón manual en Monitoreo (solo admins).
export async function POST(request: Request) {
  const guard = await requireMonitoreoAdmin(request);
  if (!guard.ok) return guard.response;
  return ejecutar('manual', guard.email);
}
