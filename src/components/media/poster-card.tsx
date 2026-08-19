'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';

export interface MediaProps {
  id: string | number;
  title: string;
  posterPath?: string | null;
  year?: string | number;
  rating?: number;
}

export interface PosterCardProps {
  media: MediaProps;
  size?: 'sm' | 'md' | 'lg';
  showRating?: boolean;
  showTitle?: boolean;
  interactive?: boolean;
  priority?: boolean;
}

const sizeClasses = {
  sm: 'w-[120px] h-[180px]',
  md: 'w-[180px] h-[270px]',
  lg: 'w-[240px] h-[360px]'
};

export default function PosterCard({
  media,
  size = 'md',
  showRating = true,
  showTitle = true,
  interactive = true,
  priority = false
}: PosterCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const imageUrl = media.posterPath
    ? `https://image.tmdb.org/t/p/w500${media.posterPath}`
    : null;

  const tiltVariants = {
    rest: { rotateX: 0, rotateY: 0, scale: 1 },
    hover: { 
      rotateX: 5, 
      rotateY: -5, 
      scale: 1.05, 
      transition: { type: 'spring', stiffness: 300, damping: 20 } 
    }
  };

  const shouldAnimate = interactive && !prefersReducedMotion;

  return (
    <motion.div
      className={`relative rounded-lg overflow-hidden bg-gradient-to-br from-[#1a1a24] to-[#0a0a0f] flex-shrink-0 shadow-lg ${sizeClasses[size]} cursor-pointer`}
      initial="rest"
      whileHover={shouldAnimate ? "hover" : "rest"}
      variants={shouldAnimate ? tiltVariants : undefined}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
      role="group"
      aria-label={`${media.title} ${media.year ? `(${media.year})` : ''}`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${media.title} (${media.year || 'Unknown Year'})`}
          fill
          sizes="(max-width: 768px) 120px, (max-width: 1200px) 180px, 240px"
          className="object-cover transition-opacity duration-300"
          priority={priority}
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center border border-[#252533] rounded-lg">
          <span className="text-gray-400 font-bold text-sm tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-gray-300 to-gray-500">
            {media.title}
          </span>
        </div>
      )}

      {/* Hover Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-[#05050a] via-[#05050a]/40 to-transparent transition-opacity duration-300 flex flex-col justify-end p-4 ${
          isHovered && interactive ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {showTitle && (
          <h3 className="text-white font-bold text-sm md:text-base leading-tight mb-1 drop-shadow-md line-clamp-2">
            {media.title}
          </h3>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-300">
          {media.year && <span>{media.year}</span>}
          {showRating && media.rating && (
            <span className="flex items-center gap-1 text-[#a855f7] font-semibold drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]">
              ★ {media.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      
      {/* Always-on Rating Badge if rating exists and not hovered */}
      {showRating && media.rating && (!isHovered || !interactive) && (
         <div className="absolute top-2 right-2 bg-[#0a0a0f]/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs font-bold text-[#a855f7] border border-[#a855f7]/30 shadow-lg">
           {media.rating.toFixed(1)}
         </div>
      )}
    </motion.div>
  );
}
