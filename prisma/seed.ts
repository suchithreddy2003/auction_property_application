// Seed script — admin users, sample listings, plans, sources, partner.
// Idempotent: safe to re-run.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { computeRiskScore } from '../src/lib/risk-score';

const prisma = new PrismaClient();

async function hashed(p: string) { return bcrypt.hash(p, 10); }

async function upsertUser(email: string, role: string, name: string, password: string) {
  return prisma.user.upsert({
    where: { email },
    update: { name, role },
    create: { email, name, role, passwordHash: await hashed(password), emailVerified: true },
  });
}

async function main() {
  console.log('Seeding…');

  // Users
  const superAdmin = await upsertUser('superadmin@example.com', 'SUPER_ADMIN', 'Sandhya (Super)', 'Super@123');
  const manager    = await upsertUser('manager@example.com',    'MANAGER',     'Manjula (Mgr)',   'Manager@123');
  const exec       = await upsertUser('exec@example.com',       'EXECUTIVE',   'Edward (Exec)',   'Exec@1234');
  const buyer      = await upsertUser('buyer@example.com',      'BUYER',       'Bharath (Buyer)', 'Buyer@123');

  // Sources
  const sources = await Promise.all([
    prisma.source.upsert({
      where: { id: 'src-baanknet' },
      update: {},
      create: { id: 'src-baanknet', name: 'BAANKNET', type: 'OFFICIAL_PLATFORM', baseUrl: 'https://baanknet.gov.in', enabled: true },
    }),
    prisma.source.upsert({
      where: { id: 'src-sbi' },
      update: {},
      create: { id: 'src-sbi', name: 'SBI E-Auction', type: 'BANK_WEBSITE', baseUrl: 'https://www.sbi.co.in', enabled: true },
    }),
    prisma.source.upsert({
      where: { id: 'src-hdfc' },
      update: {},
      create: { id: 'src-hdfc', name: 'HDFC Auctions', type: 'BANK_WEBSITE', baseUrl: 'https://www.hdfcbank.com', enabled: true },
    }),
    prisma.source.upsert({
      where: { id: 'src-eauction' },
      update: {},
      create: { id: 'src-eauction', name: 'eAuctionsIndia', type: 'AUCTION_ENGINE', baseUrl: 'https://www.eauctionsindia.com', enabled: true },
    }),
    prisma.source.upsert({
      where: { id: 'src-th' },
      update: {},
      create: { id: 'src-th', name: 'The Hindu (e-paper)', type: 'NEWSPAPER', baseUrl: 'https://epaper.thehindu.com', enabled: true },
    }),
  ]);

  // Subscription plans
  const plans = [
    {
      code: 'BASIC',
      name: 'Basic',
      priceInPaise: 49900,        // ₹499
      durationDays: 30,
      entitlements: {
        features: [
          'Full listing details',
          'Reserve price and EMD shown',
          'Document previews',
          'High-level risk score',
        ],
      },
    },
    {
      code: 'PRO',
      name: 'Pro',
      priceInPaise: 99900,        // ₹999
      durationDays: 30,
      entitlements: {
        features: [
          'Everything in Basic',
          'Exact address and bank contact',
          'Full document downloads',
          'Detailed risk breakdown',
          'WhatsApp alerts (when enabled)',
        ],
      },
    },
    {
      code: 'INVESTOR',
      name: 'Investor',
      priceInPaise: 249900,       // ₹2,499
      durationDays: 30,
      entitlements: {
        features: [
          'Everything in Pro',
          'Re-auction history dashboards',
          'Priority support',
          'Portfolio watchlists',
        ],
      },
    },
  ];
  for (const p of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        priceInPaise: p.priceInPaise,
        durationDays: p.durationDays,
        entitlements: JSON.stringify(p.entitlements),
        enabled: true,
      },
      create: {
        code: p.code,
        name: p.name,
        priceInPaise: p.priceInPaise,
        durationDays: p.durationDays,
        entitlements: JSON.stringify(p.entitlements),
        enabled: true,
      },
    });
  }

  // Partners
  await Promise.all([
    prisma.partner.upsert({
      where: { id: 'p-legal-1' },
      update: {},
      create: {
        id: 'p-legal-1',
        name: 'Singh & Associates Advocates',
        category: 'LEGAL',
        region: 'MH',
        contactEmail: 'contact@singhlegal.example',
        active: true,
      },
    }),
    prisma.partner.upsert({
      where: { id: 'p-valuer-1' },
      update: {},
      create: {
        id: 'p-valuer-1',
        name: 'Apex Valuers',
        category: 'VALUER',
        region: 'KA',
        contactEmail: 'desk@apexvaluers.example',
        active: true,
      },
    }),
  ]);

  // Sample listings
  type Sample = {
    title: string;
    propertyType: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'LAND';
    lenderName: string;
    branch?: string;
    addressLine: string;
    locality: string;
    city: string;
    state: string;
    pincode: string;
    reservePrice: number;
    emd: number;
    bidIncrement: number;
    auctionDateTime: Date;
    inspectionStart: Date;
    inspectionEnd: Date;
    emdLastDate: Date;
    contactPhone: string;
    contactEmail: string;
    possession: 'PHYSICAL' | 'SYMBOLIC' | 'UNKNOWN';
    documentCompleteness: number;
    hasEncumbrance: boolean;
    hasLitigation: boolean;
    isPremium: boolean;
    loanAvailable: boolean;
    publish: boolean;
    sourceTrustTier: 'A' | 'B' | 'C' | 'D';
  };

  const days = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
  const samples: Sample[] = [
    {
      title: '2BHK Apartment in Hinjewadi, Pune',
      propertyType: 'RESIDENTIAL',
      lenderName: 'State Bank of India', branch: 'Hinjewadi',
      addressLine: 'Flat 502, Mont Vert Vesta, Tower B', locality: 'Hinjewadi Phase 1',
      city: 'Pune', state: 'MH', pincode: '411057',
      reservePrice: 6500000, emd: 650000, bidIncrement: 50000,
      auctionDateTime: days(14), inspectionStart: days(7), inspectionEnd: days(8), emdLastDate: days(12),
      contactPhone: '+91-9999000011', contactEmail: 'sbi-pune@bank.example',
      possession: 'PHYSICAL', documentCompleteness: 0.85,
      hasEncumbrance: false, hasLitigation: false,
      isPremium: true, loanAvailable: true, publish: true, sourceTrustTier: 'A',
    },
    {
      title: 'Commercial Shop in Indiranagar, Bengaluru',
      propertyType: 'COMMERCIAL',
      lenderName: 'HDFC Bank', branch: 'Indiranagar',
      addressLine: 'Shop 4, 100ft Road', locality: 'Indiranagar',
      city: 'Bengaluru', state: 'KA', pincode: '560038',
      reservePrice: 12500000, emd: 1250000, bidIncrement: 100000,
      auctionDateTime: days(21), inspectionStart: days(10), inspectionEnd: days(11), emdLastDate: days(19),
      contactPhone: '+91-9999000022', contactEmail: 'hdfc-blr@bank.example',
      possession: 'SYMBOLIC', documentCompleteness: 0.6,
      hasEncumbrance: true, hasLitigation: false,
      isPremium: false, loanAvailable: false, publish: true, sourceTrustTier: 'B',
    },
    {
      title: 'Industrial Plot, MIDC Chakan',
      propertyType: 'INDUSTRIAL',
      lenderName: 'Bank of Baroda', branch: 'Chakan',
      addressLine: 'Plot 17, Phase 2', locality: 'MIDC',
      city: 'Pune', state: 'MH', pincode: '410501',
      reservePrice: 45000000, emd: 4500000, bidIncrement: 250000,
      auctionDateTime: days(30), inspectionStart: days(15), inspectionEnd: days(16), emdLastDate: days(28),
      contactPhone: '+91-9999000033', contactEmail: 'bob-pune@bank.example',
      possession: 'PHYSICAL', documentCompleteness: 0.9,
      hasEncumbrance: false, hasLitigation: false,
      isPremium: true, loanAvailable: true, publish: true, sourceTrustTier: 'A',
    },
    {
      title: 'Residential Plot in Whitefield',
      propertyType: 'LAND',
      lenderName: 'ICICI Bank', branch: 'Whitefield',
      addressLine: 'Survey 87/2, Off Hope Farm Road', locality: 'Whitefield',
      city: 'Bengaluru', state: 'KA', pincode: '560066',
      reservePrice: 7500000, emd: 750000, bidIncrement: 50000,
      auctionDateTime: days(10), inspectionStart: days(4), inspectionEnd: days(5), emdLastDate: days(8),
      contactPhone: '+91-9999000044', contactEmail: 'icici-blr@bank.example',
      possession: 'UNKNOWN', documentCompleteness: 0.45,
      hasEncumbrance: true, hasLitigation: true,
      isPremium: false, loanAvailable: false, publish: true, sourceTrustTier: 'C',
    },
    {
      title: '3BHK Villa, Jubilee Hills',
      propertyType: 'RESIDENTIAL',
      lenderName: 'Axis Bank', branch: 'Banjara Hills',
      addressLine: 'Villa 12, Road No 36', locality: 'Jubilee Hills',
      city: 'Hyderabad', state: 'TG', pincode: '500033',
      reservePrice: 28000000, emd: 2800000, bidIncrement: 200000,
      auctionDateTime: days(18), inspectionStart: days(9), inspectionEnd: days(10), emdLastDate: days(16),
      contactPhone: '+91-9999000055', contactEmail: 'axis-hyd@bank.example',
      possession: 'PHYSICAL', documentCompleteness: 0.75,
      hasEncumbrance: false, hasLitigation: false,
      isPremium: false, loanAvailable: true, publish: true, sourceTrustTier: 'B',
    },
    {
      title: 'Vacant Land, ECR Chennai',
      propertyType: 'LAND',
      lenderName: 'Union Bank', branch: 'Tiruvanmiyur',
      addressLine: 'Plot 23, OMR-ECR Link Rd', locality: 'Kanathur',
      city: 'Chennai', state: 'TN', pincode: '603112',
      reservePrice: 4200000, emd: 420000, bidIncrement: 25000,
      auctionDateTime: days(45), inspectionStart: days(30), inspectionEnd: days(31), emdLastDate: days(42),
      contactPhone: '+91-9999000066', contactEmail: 'ub-chn@bank.example',
      possession: 'SYMBOLIC', documentCompleteness: 0.65,
      hasEncumbrance: false, hasLitigation: false,
      isPremium: false, loanAvailable: false, publish: true, sourceTrustTier: 'B',
    },
    {
      title: 'Office Floor, Cyber City Gurugram (DRAFT — pending review)',
      propertyType: 'COMMERCIAL',
      lenderName: 'Yes Bank', branch: 'DLF',
      addressLine: 'Tower 8, DLF Cyber City', locality: 'DLF Phase 3',
      city: 'Gurugram', state: 'HR', pincode: '122002',
      reservePrice: 92000000, emd: 9200000, bidIncrement: 500000,
      auctionDateTime: days(40), inspectionStart: days(20), inspectionEnd: days(21), emdLastDate: days(38),
      contactPhone: '+91-9999000077', contactEmail: 'yes-gurgaon@bank.example',
      possession: 'SYMBOLIC', documentCompleteness: 0.5,
      hasEncumbrance: true, hasLitigation: false,
      isPremium: false, loanAvailable: false, publish: false, sourceTrustTier: 'B',
    },
  ];

  // Wipe sample listings to keep seed idempotent
  await prisma.listing.deleteMany({ where: { lenderName: { in: samples.map(s => s.lenderName) } } });

  for (const s of samples) {
    const risk = computeRiskScore({
      possession: s.possession,
      documentCompleteness: s.documentCompleteness,
      hasEncumbranceMention: s.hasEncumbrance,
      hasLitigationMention: s.hasLitigation,
      reauctionCount: 0,
      sourceTrustTier: s.sourceTrustTier,
    });
    const addressText = [s.addressLine, s.locality, s.city, s.state, s.pincode].join(' ');
    const listing = await prisma.listing.create({
      data: {
        title: s.title,
        propertyType: s.propertyType,
        auctionType: 'E_AUCTION',
        possession: s.possession,
        status: 'UPCOMING',
        lenderName: s.lenderName,
        branch: s.branch,
        addressLine: s.addressLine,
        locality: s.locality,
        city: s.city,
        state: s.state,
        pincode: s.pincode,
        addressText,
        reservePrice: s.reservePrice,
        emd: s.emd,
        bidIncrement: s.bidIncrement,
        isPremium: s.isPremium,
        loanAvailable: s.loanAvailable,
        documentCompleteness: s.documentCompleteness,
        hasEncumbrance: s.hasEncumbrance,
        hasLitigation: s.hasLitigation,
        reauctionCount: 0,
        sourceTrustTier: s.sourceTrustTier,
        riskScore: risk.score,
        riskLabel: risk.label,
        riskFactors: JSON.stringify(risk.factors),
        published: s.publish,
        publishedAt: s.publish ? new Date() : null,
        approvedById: s.publish ? manager.id : null,
      },
    });

    await prisma.auctionEvent.create({
      data: {
        listingId: listing.id,
        auctionDateTime: s.auctionDateTime,
        inspectionStart: s.inspectionStart,
        inspectionEnd: s.inspectionEnd,
        emdLastDate: s.emdLastDate,
        venueOrPlatform: 'Online (BAANKNET)',
        contactPhone: s.contactPhone,
        contactEmail: s.contactEmail,
      },
    });

    // A document for each
    await prisma.document.create({
      data: {
        listingId: listing.id,
        docType: 'SALE_NOTICE',
        visibility: 'SUBSCRIBED',
        storageKey: `samples/${listing.id}/sale-notice.pdf`,
        fileName: 'sale-notice.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 240_000,
      },
    });

    await prisma.workflowTask.create({
      data: {
        listingId: listing.id,
        state: s.publish ? 'APPROVED_PUBLISHED' : 'SUBMITTED_FOR_REVIEW',
        assigneeId: s.publish ? null : exec.id,
        history: JSON.stringify(
          s.publish
            ? [
                { at: new Date().toISOString(), actor: exec.id, from: 'IN_PROCESSING', to: 'SUBMITTED_FOR_REVIEW' },
                { at: new Date().toISOString(), actor: manager.id, from: 'SUBMITTED_FOR_REVIEW', to: 'APPROVED_PUBLISHED' },
              ]
            : [{ at: new Date().toISOString(), actor: exec.id, from: 'IN_PROCESSING', to: 'SUBMITTED_FOR_REVIEW' }]
        ),
      },
    });
  }

  console.log('Seed complete:');
  console.log('  super admin   superadmin@example.com / Super@123');
  console.log('  manager       manager@example.com / Manager@123');
  console.log('  executive     exec@example.com / Exec@1234');
  console.log('  buyer         buyer@example.com / Buyer@123');
  console.log(`  ${samples.length} sample listings, ${plans.length} plans, ${sources.length} sources.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
