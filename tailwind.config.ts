import type { Config } from 'tailwindcss';

// Design system — Hanshitha Auctions.
// Tokens mirror the client design doc (colour, typography). Semantic names are
// used directly by src/components/ui.tsx and new pages; the legacy `brand` scale
// is remapped onto trust-blue so pages not yet migrated adopt the new palette.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0f3350',       // dark buttons, strong headings
        ink: '#12212e',        // primary text
        trust: {
          DEFAULT: '#1668c4',  // primary action
          dark: '#12539e',     // hover
        },
        canvas: '#f2efe8',     // page background
        surface: '#ffffff',    // cards
        line: '#e7e2d9',       // borders / dividers
        risk: {
          low: '#1c7a4d',
          medium: '#a9670f',
          high: '#b23b32',
        },
        premium: '#a97d33',
        verified: '#0f6b72',
        muted: '#5a6b78',      // secondary text

        // Legacy scale — remapped to trust-blue so un-migrated pages stay on-brand.
        brand: {
          50: '#eef4fb',
          100: '#d9e7f6',
          500: '#1668c4',
          600: '#1668c4',
          700: '#0f3350',
        },
      },
      fontFamily: {
        sans: ['var(--font-hanken)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
