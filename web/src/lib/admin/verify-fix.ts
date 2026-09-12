import { isAiVerifyEnabled } from "./env";

export type VerifyFixInput = {
  reportId: string;
  beforeImageUrl: string;
  afterImageUrl: string;
};

export type VerifyFixResult = {
  verified: boolean;
  confidence: number;
  notes: string;
};

/**
 * Single gate for marking a report fixed.
 * Flag off → accept so the desk UI can be tested without a live model.
 * Flag on → call the vision model. Until one is wired, refuse rather than fake a pass.
 */
export async function verifyFix(input: VerifyFixInput): Promise<VerifyFixResult> {
  if (!input.reportId || !input.afterImageUrl) {
    return {
      verified: false,
      confidence: 0,
      notes: "Need a proof photo before verification can run.",
    };
  }

  if (!isAiVerifyEnabled()) {
    return {
      verified: true,
      confidence: 1,
      notes: "AI_VERIFY_ENABLED is off. Accepted without a vision model so the desk flow can be tested.",
    };
  }

  // Wire the vision model here. Do not return a synthetic pass.
  return {
    verified: false,
    confidence: 0,
    notes: "Vision model is not wired yet. Set AI_VERIFY_ENABLED=false to test the UI flow.",
  };
}
