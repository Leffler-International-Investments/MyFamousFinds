// FILE: /utils/emailOutbox.ts
// Email Outbox - Persists emails to Firestore for reliable delivery with retry

import { adminDb, FieldValue } from "./firebaseAdmin";

export type EmailJobStatus = "pending" | "sent" | "failed" | "dead";

export type EmailJob = {
  id?: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  // Tracking
  status: EmailJobStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  lastAttemptAt?: Date | null;
  nextAttemptAt?: Date | null;
  sentAt?: Date | null;
  messageId?: string;
  // Context
  eventType: string; // e.g., "seller_application_received", "seller_approved"
  eventKey: string; // Idempotency key: e.g., "sellerId:eventType:date"
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
};

const COLLECTION = "email_outbox";
const MAX_ATTEMPTS = 8;

// Exponential backoff delays in minutes: 1, 5, 15, 30, 60, 120, 240, 480
const RETRY_DELAYS_MINUTES = [1, 5, 15, 30, 60, 120, 240, 480];

function getNextRetryDelay(attempts: number): number {
  const index = Math.min(attempts, RETRY_DELAYS_MINUTES.length - 1);
  return RETRY_DELAYS_MINUTES[index];
}

/**
 * Queue an email for sending. Checks idempotency key to prevent duplicates.
 * Returns the job ID if created, or null if duplicate.
 */
export async function queueEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  eventType: string;
  eventKey: string;
  metadata?: Record<string, any>;
}): Promise<string | null> {
  if (!adminDb) {
    console.error("[emailOutbox] Firebase not configured, cannot queue email");
    return null;
  }

  const { to, subject, text, html, eventType, eventKey, metadata } = params;

  // Check for existing job with same eventKey (idempotency)
  const existing = await adminDb
    .collection(COLLECTION)
    .where("eventKey", "==", eventKey)
    .where("status", "in", ["pending", "sent"])
    .limit(1)
    .get();

  if (!existing.empty) {
    console.log(`[emailOutbox] Duplicate email skipped: ${eventKey}`);
    return null;
  }

  const now = new Date();

  // Build the job object, excluding undefined values (Firestore doesn't accept undefined)
  const job: Record<string, any> = {
    to,
    subject,
    text,
    status: "pending",
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    lastError: null,
    lastAttemptAt: null,
    nextAttemptAt: now, // Ready to send immediately
    sentAt: null,
    messageId: null,
    eventType,
    eventKey,
    metadata: metadata || {},
    createdAt: now,
    updatedAt: now,
  };

  // Only add html if it's defined
  if (html) {
    job.html = html;
  }

  const docRef = await adminDb.collection(COLLECTION).add({
    ...job,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    nextAttemptAt: FieldValue.serverTimestamp(),
  });

  console.log(`[emailOutbox] Queued email: ${docRef.id} (${eventType} to ${to})`);
  return docRef.id;
}

/**
 * Get pending emails that are ready to retry
 */
export async function getPendingEmails(limit = 10): Promise<EmailJob[]> {
  if (!adminDb) return [];

  const now = new Date();
  const snapshot = await adminDb
    .collection(COLLECTION)
    .where("status", "==", "pending")
    .where("nextAttemptAt", "<=", now)
    .orderBy("nextAttemptAt", "asc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as EmailJob[];
}

/**
 * Get all emails for admin view (with pagination)
 */
export async function getAllEmails(options?: {
  status?: EmailJobStatus;
  limit?: number;
}): Promise<EmailJob[]> {
  if (!adminDb) return [];

  let query = adminDb
    .collection(COLLECTION)
    .orderBy("createdAt", "desc");

  if (options?.status) {
    query = query.where("status", "==", options.status);
  }

  const snapshot = await query.limit(options?.limit || 50).get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || null,
      updatedAt: data.updatedAt?.toDate?.() || null,
      lastAttemptAt: data.lastAttemptAt?.toDate?.() || null,
      nextAttemptAt: data.nextAttemptAt?.toDate?.() || null,
      sentAt: data.sentAt?.toDate?.() || null,
    };
  }) as EmailJob[];
}

/**
 * Mark email as sent successfully
 */
export async function markEmailSent(jobId: string, messageId?: string): Promise<void> {
  if (!adminDb) return;

  await adminDb.collection(COLLECTION).doc(jobId).update({
    status: "sent",
    sentAt: FieldValue.serverTimestamp(),
    messageId: messageId || null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`[emailOutbox] Marked as sent: ${jobId}`);
}

/**
 * Mark email as failed, schedule retry or move to dead letter
 */
export async function markEmailFailed(
  jobId: string,
  error: string,
  currentAttempts: number
): Promise<void> {
  if (!adminDb) return;

  const newAttempts = currentAttempts + 1;
  const isDeadLetter = newAttempts >= MAX_ATTEMPTS;

  if (isDeadLetter) {
    await adminDb.collection(COLLECTION).doc(jobId).update({
      status: "dead",
      lastError: error,
      lastAttemptAt: FieldValue.serverTimestamp(),
      attempts: newAttempts,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`[emailOutbox] Moved to dead letter: ${jobId} after ${newAttempts} attempts`);
  } else {
    const delayMinutes = getNextRetryDelay(newAttempts);
    const nextAttempt = new Date(Date.now() + delayMinutes * 60 * 1000);

    await adminDb.collection(COLLECTION).doc(jobId).update({
      status: "pending",
      lastError: error,
      lastAttemptAt: FieldValue.serverTimestamp(),
      nextAttemptAt: nextAttempt,
      attempts: newAttempts,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`[emailOutbox] Scheduled retry: ${jobId} in ${delayMinutes}m (attempt ${newAttempts})`);
  }
}

/**
 * Reset a dead/failed email to pending for manual retry
 */
export async function retryEmail(jobId: string): Promise<boolean> {
  if (!adminDb) return false;

  const docRef = adminDb.collection(COLLECTION).doc(jobId);
  const doc = await docRef.get();

  if (!doc.exists) return false;

  await docRef.update({
    status: "pending",
    attempts: 0,
    nextAttemptAt: FieldValue.serverTimestamp(),
    lastError: null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`[emailOutbox] Reset for retry: ${jobId}`);
  return true;
}

/**
 * Delete an email job
 */
export async function deleteEmailJob(jobId: string): Promise<boolean> {
  if (!adminDb) return false;

  await adminDb.collection(COLLECTION).doc(jobId).delete();
  console.log(`[emailOutbox] Deleted: ${jobId}`);
  return true;
}

/**
 * Get counts by status for dashboard
 */
export async function getEmailStats(): Promise<Record<EmailJobStatus, number>> {
  if (!adminDb) {
    return { pending: 0, sent: 0, failed: 0, dead: 0 };
  }

  const statuses: EmailJobStatus[] = ["pending", "sent", "failed", "dead"];
  const counts: Record<EmailJobStatus, number> = {
    pending: 0,
    sent: 0,
    failed: 0,
    dead: 0,
  };

  await Promise.all(
    statuses.map(async (status) => {
      const snapshot = await adminDb
        .collection(COLLECTION)
        .where("status", "==", status)
        .count()
        .get();
      counts[status] = snapshot.data().count;
    })
  );

  return counts;
}
