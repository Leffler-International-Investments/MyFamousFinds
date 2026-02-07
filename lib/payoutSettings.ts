// FILE: /lib/payoutSettings.ts

import { adminDb } from "../utils/firebaseAdmin";

export type PayoutSettings = {
  defaultCoolingDays: number;
};

const DEFAULTS: PayoutSettings = {
  defaultCoolingDays: 7,
};

/**
 * Reads payout settings from Firestore:
 * collection: settings
 * doc: payouts
 * field: defaultCoolingDays
 */
export async function getPayoutSettings(): Promise<PayoutSettings> {
  try {
    const ref = adminDb.collection("settings").doc("payouts");
    const snap = await ref.get();
    const d: any = snap.exists ? snap.data() : null;
    const n = Number(d?.defaultCoolingDays);
    return {
      defaultCoolingDays:
        Number.isFinite(n) && n >= 0 && n <= 60
          ? Math.round(n)
          : DEFAULTS.defaultCoolingDays,
    };
  } catch {
    return DEFAULTS;
  }
}
