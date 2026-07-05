import * as React from 'react';
import { cn } from '@/lib/cn';

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants: Record<string, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-gray-400',
    secondary: 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const sizes: Record<string, string> = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-12 px-6 text-lg',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm',
        'focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm',
        'focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
        'focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1 block text-sm font-medium text-gray-700', className)} {...props} />;
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-gray-200 bg-white shadow-sm', className)}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = 'default',
  children,
}: {
  className?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
}) {
  const tones = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
