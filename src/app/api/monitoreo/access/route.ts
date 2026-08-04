import { NextResponse } from 'next/server';
import '@/lib/firebase-admin';
import { isMonitoreoAdmin, verifyIdTokenFromRequest } from '@/lib/monitoreo/auth';

// Autochequeo silencioso: usado solo para decidir si mostrar el botón/ruta de
// monitoreo en la UI. No registra nada — que un usuario normal no tenga
// acceso es el caso esperado en cada carga de página, no un evento de
// seguridad. El registro real de accesos no autorizados vive en
// requireMonitoreoAdmin, usado por las rutas que sí exponen datos.
export async function GET(request: Request) {
  const email = await verifyIdTokenFromRequest(request);
  if (!email) {
    return NextResponse.json({ success: true, hasAccess: false });
  }

  const hasAccess = await isMonitoreoAdmin(email);
  return NextResponse.json({ success: true, hasAccess });
}
