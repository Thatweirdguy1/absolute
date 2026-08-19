'use client';

import React from 'react';
import { motion } from 'framer-motion';
import PosterCard, { MediaProps } from './poster-card';

interface PosterGridProps {
  items: MediaProps[];
  size?: 'sm' | 'md' | 'lg';
  emptyMessage?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function PosterGrid({ items, size = 'md', emptyMessage = "No items found." }: PosterGridProps) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-[#1a1a24] flex items-center justify-center text-[#a855f7] text-2xl shadow-[0_0_15px_rgba(168,85,247,0.2)]">
          ∅
        </div>
        <p className="text-gray-400 text-lg font-light tracking-wide">{emptyMessage}</p>
      </div>
    );
  }

  // NOTE: For extremely large collections (e.g., > 100 items), 
  // implement virtual scrolling here using @tanstack/react-virtual
  // to maintain performance and avoid DOM bloat.

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {items.map((media, index) => (
        <motion.div key={media.id || index} variants={itemVariants} className="flex justify-center">
          <PosterCard 
            media={media} 
            size="md" // Responsive via CSS grid, baseline aspect ratio matching
            priority={index < 10} // Eager load above fold items
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
