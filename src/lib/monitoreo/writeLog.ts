import '@/lib/firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import {
  LOG_METADATA_MAX_LEN,
  LOG_MESSAGE_MAX_LEN,
  LOG_STACK_MAX_LEN,
  SYSTEM_LOGS_COLLECTION,
} from '@/constants/monitoreo';
import type { LogCategory, LogCode, LogLevel, LogSource } from '@/constants/logCodes';

export interface WriteLogInput {
  level: LogLevel;
  category: LogCategory;
  code: LogCode;
  message: string;
  stack?: string;
  source: LogSource;
  route?: string;
  userEmail?: string;
  userAgent?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
  clientTimestamp?: string;
}

function truncate(value: string, maxLen: number): string {
  return value.length > maxLen ? value.slice(0, maxLen) : value;
}

function safeMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> | null {
  if (!metadata) return null;
  try {
    const serialized = JSON.stringify(metadata);
    if (serialized.length > LOG_METADATA_MAX_LEN) return null;
    return metadata;
  } catch {
    return null;
  }
}

// Único punto de escritura a Firestore para logs. Nunca debe lanzar: un fallo
// al registrar un evento no puede convertirse en un segundo fallo aguas arriba.
export async function writeLog(input: WriteLogInput): Promise<void> {
  try {
    const db = getFirestore();
    await db.collection(SYSTEM_LOGS_COLLECTION).add({
      timestamp: FieldValue.serverTimestamp(),
      clientTimestamp: input.clientTimestamp ?? null,
      level: input.level,
      category: input.category,
      code: input.code,
      message: truncate(input.message, LOG_MESSAGE_MAX_LEN),
      stack: input.stack ? truncate(input.stack, LOG_STACK_MAX_LEN) : null,
      source: input.source,
      route: input.route ?? null,
      userEmail: input.userEmail ? input.userEmail.toLowerCase() : null,
      userAgent: input.userAgent ? truncate(input.userAgent, 500) : null,
      ip: input.ip ?? null,
      metadata: safeMetadata(input.metadata),
    });
  } catch (err) {
    console.error('[monitoreo] writeLog failed', err);
  }
}
