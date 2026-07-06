import * as React from 'react';
import { cn } from '@/lib/cn';

// Full-width navy gradient hero band.
// - `badge`: single pill above the title (centered heroes, e.g. Calendar).
// - `eyebrow`: uppercase overline label (left-aligned heroes, e.g. Services).
// - `children`: extra content below the subtitle (pills, search, etc.).
export function Hero({
  eyebrow,
  badge,
  title,
  subtitle,
  align = 'center',
  className,
  children,
}: {
  eyebrow?: React.ReactNode;
  badge?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: 'center' | 'left';
  className?: string;
  children?: React.ReactNode;
}) {
  const left = align === 'left';
  return (
    <section
      className={cn('bg-[linear-gradient(165deg,#12385a,#0e2a41)] px-[22px] py-12 text-white', className)}
    >
      <div className={cn('mx-auto max-w-[1200px]', left ? '' : 'text-center')}>
        <div className={left ? 'max-w-[720px]' : ''}>
          {eyebrow && (
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#7fb2e6]">
              {eyebrow}
            </div>
          )}
          {badge && (
            <div className="mb-[18px] inline-flex items-center gap-[7px] rounded-full border border-white/20 bg-white/10 px-[13px] py-[6px] text-[12.5px] font-medium">
              {badge}
            </div>
          )}
          <h1 className="text-[clamp(30px,5vw,48px)] font-extrabold leading-[1.08] tracking-[-0.025em]">
            {title}
          </h1>
          {subtitle && (
            <p
              className={cn(
                'mt-3 text-[clamp(15px,2vw,18px)] leading-[1.55] text-[#c4d6e6]',
                left ? 'max-w-[600px]' : 'mx-auto max-w-[620px]'
              )}
            >
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}
