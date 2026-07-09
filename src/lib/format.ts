// Display formatting for figures & dates. Figures use compact Indian units
// (L / Cr) to match the design system's mono metadata style.

export function formatCompactINR(rupees: number | null | undefined): string {
  if (rupees == null) return '—';
  if (rupees >= 1e7) return '₹ ' + Math.round((rupees / 1e7) * 100) / 100 + ' Cr';
  if (rupees >= 1e5) return '₹ ' + Math.round((rupees / 1e5) * 10) / 10 + ' L';
  return '₹ ' + Number(rupees).toLocaleString('en-IN');
}

// "5 Jul 2026"
export function formatAuctionDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// "Physical" from "PHYSICAL" / "Residential flat" from "RESIDENTIAL_FLAT"
export function titleCase(s?: string | null): string {
  if (!s) return '';
  return s
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}
