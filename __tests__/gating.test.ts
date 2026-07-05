import { describe, test, expect } from 'vitest';
import { projectListing, canSeeDocument, type ViewerTier } from '@/lib/gating';

const sampleListing: any = {
  id: 'l1',
  title: 'Test Flat',
  propertyType: 'RESIDENTIAL',
  status: 'UPCOMING',
  city: 'Pune',
  state: 'MH',
  isPremium: false,
  reservePrice: 6500000,
  emd: 650000,
  bidIncrement: 50000,
  lenderName: 'SBI',
  branch: 'Pune Main',
  authorizedOfficer: 'AO',
  borrowerName: 'BN',
  addressLine: 'Flat 502',
  locality: 'Hinjewadi',
  pincode: '411057',
  latitude: 18.59,
  longitude: 73.75,
  riskScore: 35,
  riskLabel: 'MEDIUM',
  riskFactors: '[]',
  auctionType: 'E_AUCTION',
  possession: 'PHYSICAL',
  loanAvailable: true,
};

describe('gating.projectListing', () => {
  test('ANON sees teaser only — no price, no address line, no contact, no risk score', () => {
    const out = projectListing(sampleListing, 'ANON');
    expect(out.priceDisplay).toBe('Login to view');
    expect(out.lenderName).toBeUndefined();
    expect(out.addressLine).toBeUndefined();
    expect(out.locality).toBeUndefined();
    expect(out.pincode).toBeUndefined();
    expect(out.riskScore).toBeUndefined();
    expect(out.contactRevealed).toBe(false);
    expect(out.documentsAccessible).toBe(false);
    expect(out.riskLabel).toBe('MEDIUM'); // teaser
  });

  test('LOGGED_IN sees price, EMD, lender, locality — but not exact address or contact', () => {
    const out = projectListing(sampleListing, 'LOGGED_IN');
    expect(out.priceDisplay).toContain('₹');
    expect(out.lenderName).toBe('SBI');
    expect(out.emd).toBe(650000);
    expect(out.riskScore).toBe(35);
    expect(out.addressDisplay).toContain('Hinjewadi');
    expect(out.addressDisplay).not.toContain('Flat 502');
    expect(out.addressLine).toBeUndefined();
    expect(out.contactRevealed).toBe(false);
    expect(out.documentsAccessible).toBe(false);
  });

  test('SUBSCRIBED sees everything', () => {
    const out = projectListing(sampleListing, 'SUBSCRIBED');
    expect(out.priceDisplay).toContain('₹');
    expect(out.addressLine).toBe('Flat 502');
    expect(out.pincode).toBe('411057');
    expect(out.borrowerName).toBe('BN');
    expect(out.contactRevealed).toBe(true);
    expect(out.documentsAccessible).toBe(true);
    expect(out.detailedRiskAvailable).toBe(true);
  });

  test('SUBSCRIBED address contains full street and pincode', () => {
    const out = projectListing(sampleListing, 'SUBSCRIBED');
    expect(out.addressDisplay).toMatch(/Flat 502/);
    expect(out.addressDisplay).toMatch(/411057/);
  });
});

describe('gating.canSeeDocument', () => {
  const cases: Array<[string, ViewerTier, boolean]> = [
    ['PUBLIC',     'ANON',       true],
    ['PUBLIC',     'LOGGED_IN',  true],
    ['PUBLIC',     'SUBSCRIBED', true],
    ['PARTIAL',    'ANON',       false],
    ['PARTIAL',    'LOGGED_IN',  true],
    ['PARTIAL',    'SUBSCRIBED', true],
    ['SUBSCRIBED', 'ANON',       false],
    ['SUBSCRIBED', 'LOGGED_IN',  false],
    ['SUBSCRIBED', 'SUBSCRIBED', true],
  ];
  for (const [vis, tier, expected] of cases) {
    test(`${vis} doc, ${tier} viewer → ${expected}`, () => {
      expect(canSeeDocument(vis, tier)).toBe(expected);
    });
  }
});
