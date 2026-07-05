import { describe, test, expect } from 'vitest';
import { computeRiskScore, type RiskInput } from '@/lib/risk-score';

const baseline: RiskInput = {
  possession: 'PHYSICAL',
  documentCompleteness: 1,
  hasEncumbranceMention: false,
  hasLitigationMention: false,
  reauctionCount: 0,
  sourceTrustTier: 'A',
};

describe('risk-score', () => {
  test('best-case inputs produce LOW risk', () => {
    const r = computeRiskScore(baseline);
    expect(r.label).toBe('LOW');
    expect(r.score).toBeLessThan(33);
  });

  test('worst-case inputs produce HIGH risk', () => {
    const r = computeRiskScore({
      possession: 'UNKNOWN',
      documentCompleteness: 0,
      hasEncumbranceMention: true,
      hasLitigationMention: true,
      reauctionCount: 3,
      sourceTrustTier: 'D',
      priceDeviationFromMarket: 0.8,
    });
    expect(r.label).toBe('HIGH');
    expect(r.score).toBeGreaterThanOrEqual(66);
  });

  test('all factor contributions sum (approximately) to score', () => {
    const r = computeRiskScore(baseline);
    const sum = Math.round(r.factors.reduce((s, f) => s + f.contribution, 0));
    expect(Math.abs(sum - r.score)).toBeLessThanOrEqual(1);
  });

  test('score is clamped to [0, 100]', () => {
    const r = computeRiskScore({
      ...baseline,
      reauctionCount: 100,
      hasEncumbranceMention: true,
      hasLitigationMention: true,
      priceDeviationFromMarket: 5,
    });
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.score).toBeGreaterThanOrEqual(0);
  });

  test('source tier C raises score vs tier A', () => {
    const a = computeRiskScore({ ...baseline, sourceTrustTier: 'A' }).score;
    const c = computeRiskScore({ ...baseline, sourceTrustTier: 'C' }).score;
    expect(c).toBeGreaterThan(a);
  });

  test('factors include reason text', () => {
    const r = computeRiskScore({ ...baseline, hasEncumbranceMention: true });
    const legal = r.factors.find((f) => f.key === 'legalFlags');
    expect(legal?.reason).toMatch(/encumbrance/);
  });
});
