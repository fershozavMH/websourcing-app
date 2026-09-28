import { NextResponse } from 'next/server';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebase-admin';
import { verifyIdTokenFromRequest } from '@/lib/monitoreo/auth';
import {
  PRESENCE_PING_INTERVAL_MS,
  PRESENCE_RETENTION_DAYS,
  USER_PRESENCE_COLLECTION,
  USER_PRESENCE_DAILY_COLLECTION,
} from '@/constants/monitoreo';

const PRESENCE_MINUTES_PER_PING = PRESENCE_PING_INTERVAL_MS / 60_000;

// Latido de presencia: cualquier usuario autenticado registra que sigue activo.
// Además acumula minutos activos por día, para estimar horas de uso por
// usuario sin guardar cada latido individual.
export async function POST(request: Request) {
  const email = await verifyIdTokenFromRequest(request);
  if (!email) {
    return NextResponse.json({ success: false, error: 'No autenticado.' }, { status: 401 });
  }

  try {
    const db = getFirestore();
    const today = new Date().toISOString().slice(0, 10);
    const dailyDocId = `${email}_${today}`;

    await Promise.all([
      db
        .collection(USER_PRESENCE_COLLECTION)
        .doc(email)
        .set({ email, lastSeen: FieldValue.serverTimestamp() }, { merge: true }),
      db
        .collection(USER_PRESENCE_DAILY_COLLECTION)
        .doc(dailyDocId)
        .set(
          {
            email,
            date: today,
            minutes: FieldValue.increment(PRESENCE_MINUTES_PER_PING),
            lastPing: FieldValue.serverTimestamp(),
            expireAt: new Date(Date.now() + PRESENCE_RETENTION_DAYS * 24 * 60 * 60 * 1000),
          },
          { merge: true },
        ),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[presence] error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
