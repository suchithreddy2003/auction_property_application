// Stringly-typed enums mirroring those declared in schema.prisma.
// Use these unions everywhere instead of bare strings so the type system
// catches drift between the schema and the app.

export const Roles = ['BUYER', 'EXECUTIVE', 'MANAGER', 'SUPER_ADMIN'] as const;
export type Role = (typeof Roles)[number];

export const SourceTypes = [
  'OFFICIAL_PLATFORM',
  'AUCTION_ENGINE',
  'BANK_WEBSITE',
  'NEWSPAPER',
  'AGGREGATOR',
  'MANUAL',
] as const;
export type SourceType = (typeof SourceTypes)[number];

export const PropertyTypes = [
  'RESIDENTIAL',
  'COMMERCIAL',
  'INDUSTRIAL',
  'LAND',
  'AGRICULTURAL',
  'VEHICLE',
  'OTHER',
] as const;
export type PropertyType = (typeof PropertyTypes)[number];

export const PossessionTypes = ['PHYSICAL', 'SYMBOLIC', 'UNKNOWN'] as const;
export type PossessionType = (typeof PossessionTypes)[number];

export const AuctionTypes = ['E_AUCTION', 'PHYSICAL', 'HYBRID'] as const;
export type AuctionType = (typeof AuctionTypes)[number];

export const ListingStatuses = [
  'UPCOMING',
  'LIVE',
  'COMPLETED',
  'SOLD',
  'WITHDRAWN',
  'RE_AUCTION',
] as const;
export type ListingStatus = (typeof ListingStatuses)[number];

export const RiskLabels = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type RiskLabel = (typeof RiskLabels)[number];

export const DocTypes = [
  'SALE_NOTICE',
  'TERMS',
  'VALUATION',
  'ENCUMBRANCE',
  'PHOTO',
  'MISC',
] as const;
export type DocType = (typeof DocTypes)[number];

export const DocVisibilities = ['PUBLIC', 'PARTIAL', 'SUBSCRIBED'] as const;
export type DocVisibility = (typeof DocVisibilities)[number];

export const WorkflowStates = [
  'DISCOVERED',
  'DEDUPE_FLAGGED',
  'ASSIGNED',
  'IN_PROCESSING',
  'SUBMITTED_FOR_REVIEW',
  'APPROVED_PUBLISHED',
  'REJECTED',
  'ARCHIVED',
] as const;
export type WorkflowState = (typeof WorkflowStates)[number];

export const SubStatuses = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'] as const;
export type SubStatus = (typeof SubStatuses)[number];

export const PaymentKinds = ['SUBSCRIPTION', 'REPORT', 'SERVICE', 'OTHER'] as const;
export type PaymentKind = (typeof PaymentKinds)[number];

export const PaymentStatuses = ['CREATED', 'PAID', 'FAILED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PaymentStatuses)[number];

export const CommChannels = ['CALL', 'EMAIL', 'WHATSAPP', 'CHAT', 'NOTE'] as const;
export type CommChannel = (typeof CommChannels)[number];

export const PartnerCategories = [
  'LEGAL',
  'VALUER',
  'INSPECTION',
  'LOAN',
  'PROPERTY_MGMT',
  'INSURANCE',
  'OTHER',
] as const;
export type PartnerCategory = (typeof PartnerCategories)[number];

export const ServiceStatuses = [
  'REQUESTED',
  'QUOTED',
  'IN_PROGRESS',
  'DELIVERED',
  'CLOSED',
  'CANCELLED',
] as const;
export type ServiceStatus = (typeof ServiceStatuses)[number];

export const AlertStatuses = ['PENDING', 'SENT', 'FAILED', 'BOUNCED'] as const;
export type AlertStatus = (typeof AlertStatuses)[number];
