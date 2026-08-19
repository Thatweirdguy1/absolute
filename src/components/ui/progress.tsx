'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  variant?: 'default' | 'import' | 'rating';
  showLabel?: boolean;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, variant = 'default', showLabel = false, ...props }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value));

    const variants = {
      default: 'bg-purple-500',
      import: 'bg-blue-500',
      rating: 'bg-green-500',
    };

    return (
      <div 
        className={cn("w-full flex items-center gap-3", className)}
        ref={ref} 
        {...props}
      >
        <div 
          className="relative h-2 w-full overflow-hidden rounded-full bg-ink-800"
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn(
              "h-full w-full flex-1 transition-all duration-500 ease-in-out motion-reduce:transition-none",
              variants[variant]
            )}
            style={{ transform: `translateX(-${100 - clampedValue}%)` }}
          />
        </div>
        {showLabel && (
          <span className="text-sm font-medium text-smoke-300 w-10 text-right">
            {Math.round(clampedValue)}%
          </span>
        )}
      </div>
    );
  }
);
Progress.displayName = 'Progress';
