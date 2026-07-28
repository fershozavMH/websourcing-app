import '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { mapToMhApi } from '@/lib/mvpFieldMapper';

export async function POST(request: Request) {
  try {
    const { docId } = await request.json();
    if (!docId) {
      throw new Error('Falta el docId del equipo.');
    }

    const apiUrl = process.env.MH_API_URL;
    const apiKey = process.env.MH_API_KEY;
    if (!apiUrl || !apiKey) {
      throw new Error('Faltan las variables de entorno del MVP.');
    }

    const db = getFirestore();
    const docRef = db.collection('maquinaria_aprobada').doc(docId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new Error('Equipo no encontrado en Firestore.');
    }

    const payload = mapToMhApi(docId, docSnap.data() as Record<string, any>);

    const responseMh = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    if (!responseMh.ok) {
      const errorData = await responseMh.text();
      throw new Error(`Error de la API MVP (${responseMh.status}): ${errorData}`);
    }

    const mhResult = await responseMh.json().catch(() => ({}));

    try {
      await docRef.update({
        enviado_mvp: true,
        fecha_envio_mvp: new Date().toISOString(),
      });
    } catch (fbError) {
      console.warn('El equipo se envió al MVP, pero falló la actualización en Firebase:', fbError);
    }

    return NextResponse.json({ success: true, data: mhResult });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
