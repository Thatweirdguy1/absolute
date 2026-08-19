'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface StarRatingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  source?: 'personal' | 'tmdb' | 'imdb' | 'community';
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  showValue = false,
  interactive = false,
  onChange,
  source = 'personal',
  className,
  ...props
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const colors = {
    personal: 'text-purple-500',
    tmdb: 'text-green-500',
    imdb: 'text-amber-500',
    community: 'text-blue-500',
  };

  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const labels = {
    personal: 'Personal Rating',
    tmdb: 'TMDB Rating',
    imdb: 'IMDb Rating',
    community: 'Community Rating',
  };

  const currentRating = hoverRating !== null ? hoverRating : rating;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isHalf = e.clientX - rect.left < rect.width / 2;
    setHoverRating(index * 2 + (isHalf ? 1 : 2));
  };

  const handleClick = () => {
    if (interactive && onChange && hoverRating !== null) {
      onChange(hoverRating);
    }
  };

  return (
    <div 
      className={cn("flex items-center gap-2", className)} 
      title={labels[source]}
      {...props}
    >
      <div 
        className={cn(
          "flex items-center", 
          interactive && "cursor-pointer"
        )}
        onMouseLeave={() => interactive && setHoverRating(null)}
      >
        {Array.from({ length: maxStars }).map((_, i) => {
          const starValue = (i + 1) * 2;
          let fillPerc = 0;
          if (currentRating >= starValue) {
            fillPerc = 100;
          } else if (currentRating === starValue - 1) {
            fillPerc = 50;
          }

          return (
            <div 
              className="relative inline-block" 
              key={i} 
              onMouseMove={(e) => handleMouseMove(e, i)} 
              onClick={handleClick}
            >
              <svg className={cn(sizes[size], "text-ink-700")} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {fillPerc > 0 && (
                <div className="absolute top-0 left-0 overflow-hidden" style={{ width: `${fillPerc}%` }}>
                  <svg className={cn(sizes[size], colors[source])} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-smoke-300">
          {(rating / 2).toFixed(1)}
        </span>
      )}
    </div>
  );
}
