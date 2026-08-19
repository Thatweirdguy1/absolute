'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'poster' | 'stat' | 'chart';
}

export function Skeleton({ className, variant = 'text', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-ink-800 motion-reduce:animate-none',
        variant === 'text' && 'h-4 w-full',
        variant === 'poster' && 'aspect-[2/3] w-full rounded-xl',
        variant === 'stat' && 'h-24 w-full rounded-xl',
        variant === 'chart' && 'h-64 w-full rounded-xl',
        className
      )}
      {...props}
    />
  );
}
