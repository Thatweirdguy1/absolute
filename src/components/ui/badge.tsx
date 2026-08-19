'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'genre' | 'rating' | 'status';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
          variant === 'default' && 'bg-ink-800 text-smoke-200 border border-ink-700',
          variant === 'genre' && 'bg-purple-900/30 text-purple-300 border border-purple-500/20',
          variant === 'rating' && 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
          variant === 'status' && 'bg-green-500/10 text-green-400 border border-green-500/20',
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';
