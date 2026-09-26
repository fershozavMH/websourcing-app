import { NextResponse } from 'next/server';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebase-admin';
import { verifyIdTokenFromRequest } from '@/lib/monitoreo/auth';
import { USER_PRESENCE_COLLECTION } from '@/constants/monitoreo';

// Latido de presencia: cualquier usuario autenticado registra que sigue activo.
export async function POST(request: Request) {
  const email = await verifyIdTokenFromRequest(request);
  if (!email) {
    return NextResponse.json({ success: false, error: 'No autenticado.' }, { status: 401 });
  }

  try {
    await getFirestore()
      .collection(USER_PRESENCE_COLLECTION)
      .doc(email)
      .set({ email, lastSeen: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[presence] error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
