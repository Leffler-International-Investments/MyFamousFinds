// FILE: /lib/payoutSettings.ts
import { adminDb } from "../utils/firebaseAdmin";

export type PayoutMode = "manual" | "stripe_connect_auto";

export type PayoutSettings = {
  defaultCoolingDays: number;
  payoutMode: PayoutMode;
  updatedAt?: any;
};

const DOC_PATH = "settings/payout";

export async function getPayoutSettings(): Promise<PayoutSettings> {
  const snap = await adminDb.doc(DOC_PATH).get();
  const data = snap.exists ? (snap.data() as any) : {};

  return {
    defaultCoolingDays:
      typeof data.defaultCoolingDays === "number" && data.defaultCoolingDays >= 0
        ? data.defaultCoolingDays
        : 7,
    payoutMode: (data.payoutMode as PayoutMode) || "manual",
    updatedAt: data.updatedAt,
  };
}

export async function setPayoutSettings(partial: Partial<PayoutSettings>) {
  const current = await getPayoutSettings();
  const next: PayoutSettings = {
    ...current,
    ...partial,
    defaultCoolingDays:
      typeof partial.defaultCoolingDays === "number"
        ? Math.max(0, Math.floor(partial.defaultCoolingDays))
        : current.defaultCoolingDays,
    payoutMode: partial.payoutMode || current.payoutMode,
    updatedAt: new Date(),
  };

  await adminDb.doc(DOC_PATH).set(next, { merge: true });
  return next;
}
