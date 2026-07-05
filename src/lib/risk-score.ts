// Rules-based, explainable risk score per requirements §6.1.
// Range 0–100 (higher = riskier). Label thresholds at 33 / 66.
//
// Inputs are intentionally narrow so the scorer can be unit-tested.

import type { RiskLabel } from '@/types/enums';

export type RiskInput = {
  possession: string;              // PHYSICAL | SYMBOLIC | UNKNOWN
  documentCompleteness: number;    // 0..1
  hasEncumbranceMention: boolean;
  hasLitigationMention: boolean;
  reauctionCount: number;
  sourceTrustTier: 'A' | 'B' | 'C' | 'D';
  priceDeviationFromMarket?: number; // -1..+1, undefined if not estimable
};

export type RiskFactor = {
  key: string;
  weight: number;       // 0..1 weight in final score
  contribution: number; // 0..100 — already-weighted contribution to the score
  reason: string;
};

export type RiskResult = {
  score: number;
  label: RiskLabel;
  factors: RiskFactor[];
};

const TRUST_RISK: Record<RiskInput['sourceTrustTier'], number> = {
  A: 5,
  B: 25,
  C: 50,
  D: 75,
};

export function computeRiskScore(input: RiskInput): RiskResult {
  const factors: RiskFactor[] = [];

  // Possession: physical = lowest risk, unknown = highest
  const possessionRisk =
    input.possession === 'PHYSICAL' ? 10 :
    input.possession === 'SYMBOLIC' ? 55 : 75;
  factors.push({
    key: 'possession',
    weight: 0.2,
    contribution: possessionRisk * 0.2,
    reason: `Possession is ${input.possession}`,
  });

  // Document completeness: invert (less complete = higher risk)
  const docRisk = Math.round((1 - clamp01(input.documentCompleteness)) * 100);
  factors.push({
    key: 'documentCompleteness',
    weight: 0.2,
    contribution: docRisk * 0.2,
    reason: `Document set is ${Math.round(input.documentCompleteness * 100)}% complete`,
  });

  // Encumbrance / litigation mentions
  const legalRisk = (input.hasEncumbranceMention ? 50 : 0) +
                    (input.hasLitigationMention ? 50 : 0);
  factors.push({
    key: 'legalFlags',
    weight: 0.2,
    contribution: Math.min(100, legalRisk) * 0.2,
    reason: legalFlagReason(input),
  });

  // Re-auction history: count >0 means the asset failed before
  const reauctionRisk = Math.min(100, input.reauctionCount * 30);
  factors.push({
    key: 'reauctionHistory',
    weight: 0.15,
    contribution: reauctionRisk * 0.15,
    reason: input.reauctionCount > 0
      ? `Previously failed ${input.reauctionCount} time(s)`
      : 'No prior failed auctions on record',
  });

  // Source trust tier (per §3.1)
  const trustRisk = TRUST_RISK[input.sourceTrustTier];
  factors.push({
    key: 'sourceTrust',
    weight: 0.15,
    contribution: trustRisk * 0.15,
    reason: `Source tier ${input.sourceTrustTier} (A=official, D=unverified)`,
  });

  // Price deviation: |deviation| above 25% raises a flag
  if (input.priceDeviationFromMarket !== undefined) {
    const dev = Math.abs(input.priceDeviationFromMarket);
    const priceRisk = dev > 0.5 ? 80 : dev > 0.25 ? 50 : 15;
    factors.push({
      key: 'priceAnomaly',
      weight: 0.1,
      contribution: priceRisk * 0.1,
      reason: `Reserve price deviates ${(dev * 100).toFixed(0)}% from market estimate`,
    });
  }

  const score = Math.round(
    factors.reduce((sum, f) => sum + f.contribution, 0)
  );
  const label: RiskLabel = score >= 66 ? 'HIGH' : score >= 33 ? 'MEDIUM' : 'LOW';

  return { score: Math.min(100, Math.max(0, score)), label, factors };
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, isFinite(n) ? n : 0));
}

function legalFlagReason(input: RiskInput): string {
  const flags: string[] = [];
  if (input.hasEncumbranceMention) flags.push('encumbrance noted');
  if (input.hasLitigationMention) flags.push('litigation noted');
  return flags.length ? `Legal flags: ${flags.join(', ')}` : 'No legal flags found in notice';
}
