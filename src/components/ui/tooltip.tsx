'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

export function Tooltip({ content, position = 'top', children, className, ...props }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className={cn("relative inline-block", className)} 
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      {...props}
    >
      {children}
      {isVisible && (
        <div 
          className={cn(
            "absolute z-50 px-2 py-1 text-xs font-medium text-smoke-100 bg-ink-700 border border-purple-500/30 rounded whitespace-nowrap animate-in fade-in zoom-in duration-200 motion-reduce:animate-none",
            positionClasses[position]
          )}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
}
