import * as React from 'react';
import { cn } from '@/lib/cn';

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'dark' | 'secondary' | 'ghost' | 'link' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants: Record<string, string> = {
    primary: 'bg-trust text-white hover:bg-trust-dark disabled:bg-muted',      // Search auctions
    dark: 'bg-navy text-white hover:bg-ink disabled:bg-muted',                 // Talk to an agent
    secondary: 'bg-surface border border-line text-ink hover:bg-canvas',       // Get a report
    ghost: 'text-ink hover:bg-canvas',
    link: 'text-trust hover:text-trust-dark hover:underline px-0 h-auto',       // View details →
    success: 'bg-risk-low text-white hover:brightness-95 disabled:bg-muted',    // Small primary
    danger: 'bg-risk-high text-white hover:brightness-95 disabled:bg-muted',
  };
  const sizes: Record<string, string> = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        variant !== 'link' && sizes[size],
        className
      )}
      {...props}
    />
  );
}

const fieldBase =
  'w-full rounded-md border border-line bg-surface text-sm text-ink placeholder:text-muted ' +
  'focus:border-trust focus:outline-none focus:ring-1 focus:ring-trust';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('h-10 px-3', fieldBase, className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('h-10 px-3', fieldBase, className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('min-h-[80px] px-3 py-2', fieldBase, className)} {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1 block text-sm font-medium text-ink', className)} {...props} />;
}

// Uppercase micro-label above sections/fields (OVERLINE LABEL in the design doc).
export function Overline({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('text-xs font-semibold uppercase tracking-wider text-muted', className)}
      {...props}
    />
  );
}

export function Checkbox({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn('h-4 w-4 rounded border-line text-trust accent-trust focus:ring-trust', className)}
      {...props}
    />
  );
}

// CSS-only switch. Render around a native checkbox for accessibility.
export function Toggle({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn('relative inline-flex h-5 w-9 cursor-pointer items-center', className)}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <span className="absolute inset-0 rounded-full bg-line transition-colors peer-checked:bg-trust" />
      <span className="absolute left-0.5 h-4 w-4 rounded-full bg-surface shadow transition-transform peer-checked:translate-x-4" />
    </label>
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-line bg-surface shadow-sm', className)}
      {...props}
    />
  );
}

// Tones cover the design doc's Risk / Status / Meta badges.
// Legacy tones (default/success/warning/danger/info) are kept for un-migrated callers.
const badgeTones = {
  // legacy
  default: 'bg-canvas text-muted border border-line',
  success: 'bg-risk-low/10 text-risk-low border border-risk-low/30',
  warning: 'bg-risk-medium/10 text-risk-medium border border-risk-medium/30',
  danger: 'bg-risk-high/10 text-risk-high border border-risk-high/30',
  info: 'bg-trust/10 text-trust border border-trust/30',
  // risk
  'risk-low': 'bg-risk-low/10 text-risk-low border border-risk-low/30',
  'risk-medium': 'bg-risk-medium/10 text-risk-medium border border-risk-medium/30',
  'risk-high': 'bg-risk-high/10 text-risk-high border border-risk-high/30',
  // status
  open: 'bg-risk-low/10 text-risk-low border border-risk-low/30',
  upcoming: 'bg-trust/10 text-trust border border-trust/30',
  reauction: 'bg-premium/10 text-premium border border-premium/30',
  closed: 'bg-canvas text-muted border border-line',
  // meta
  neutral: 'bg-surface text-muted border border-line',
  premium: 'bg-premium/10 text-premium border border-premium/40',
  verified: 'bg-verified/10 text-verified border border-verified/30',
} as const;

export type BadgeTone = keyof typeof badgeTones;

export function Badge({
  className,
  tone = 'default',
  dot = false,
  children,
}: {
  className?: string;
  tone?: BadgeTone;
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        badgeTones[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
