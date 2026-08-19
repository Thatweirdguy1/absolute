'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: '◉', path: '/' },
  { id: 'import', label: 'Import', icon: '⬆', path: '/import' },
  { id: 'history', label: 'History', icon: '☰', path: '/history' },
  { id: 'stats', label: 'Stats', icon: '◈', path: '/stats' },
  { id: 'rankings', label: 'Rankings', icon: '▲', path: '/rankings' },
  { id: 'compare', label: 'Compare', icon: '⇌', path: '/compare' },
  { id: 'community', label: 'Community', icon: '◎', path: '/community' },
  { id: 'settings', label: 'Settings', icon: '⚙', path: '/settings' },
];

export function Navigation() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainMobileItems = NAV_ITEMS.slice(0, 4);
  const moreMobileItems = NAV_ITEMS.slice(4);

  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav
        className="hidden md:flex flex-col fixed top-0 left-0 h-screen bg-[#0a0a0f] border-r border-[#1a1a24] z-50 transition-all duration-300"
        initial={{ width: 72 }}
        animate={{ width: isHovered ? 240 : 72 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        aria-label="Main Navigation"
      >
        <div className="p-4 flex items-center justify-center h-20 border-b border-[#1a1a24]">
          <Link href="/" className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <span className="text-[#a855f7] text-3xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              {isHovered ? 'ABSOLUTE' : 'A'}
            </span>
          </Link>
        </div>

        <div className="flex-1 py-6 flex flex-col gap-2 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.id}
                href={item.path}
                className={`flex items-center gap-4 px-6 py-3 transition-colors ${
                  isActive 
                    ? 'text-[#a855f7] border-l-2 border-[#a855f7] bg-[#1a1a24]/50' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1a24]'
                }`}
              >
                <span className="text-xl flex-shrink-0 w-6 text-center">{item.icon}</span>
                <motion.span
                  className="whitespace-nowrap font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.label}
                </motion.span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-[#1a1a24]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="text-xs text-gray-500 whitespace-nowrap overflow-hidden"
          >
            Data provided by TMDB
          </motion.div>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0a0a0f]/95 backdrop-blur-md border-t border-[#1a1a24] z-50 px-2 pb-safe" aria-label="Mobile Navigation">
        <div className="flex justify-around items-center h-16">
          {mainMobileItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.id}
                href={item.path}
                className={`flex flex-col items-center justify-center w-full h-full min-w-[44px] min-h-[44px] ${
                  isActive ? 'text-[#a855f7] drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'text-gray-400'
                }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center justify-center w-full h-full min-w-[44px] min-h-[44px] ${
              mobileMenuOpen ? 'text-[#a855f7] drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'text-gray-400'
            }`}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-more-menu"
          >
            <span className="text-xl mb-1">⋯</span>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile More Sheet */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-more-menu"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="md:hidden fixed bottom-16 left-0 w-full bg-[#12121a] border-t border-[#1a1a24] z-40 rounded-t-2xl shadow-2xl"
          >
            <div className="p-4 grid grid-cols-4 gap-4">
              {moreMobileItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#1a1a24] active:bg-[#252533] text-gray-300"
                >
                  <span className="text-2xl mb-2">{item.icon}</span>
                  <span className="text-xs">{item.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
