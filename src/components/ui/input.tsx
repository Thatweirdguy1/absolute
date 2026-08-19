'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, prefixIcon, suffixIcon, id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
    
    return (
      <div className={cn('w-full flex flex-col gap-1.5', className)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-smoke-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixIcon && (
            <div className="absolute left-3 flex items-center justify-center text-smoke-400 pointer-events-none">
              {prefixIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-smoke-100 placeholder:text-smoke-500 transition-colors',
              'focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
              prefixIcon && 'pl-10',
              suffixIcon && 'pr-10'
            )}
            aria-invalid={!!error}
            {...props}
          />
          {suffixIcon && (
            <div className="absolute right-3 flex items-center justify-center text-smoke-400 pointer-events-none">
              {suffixIcon}
            </div>
          )}
        </div>
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
