'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Clock, Star, Calendar, Clapperboard, Users, Filter } from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'time', label: 'Time', icon: Clock },
  { id: 'ratings', label: 'Ratings', icon: Star },
  { id: 'eras', label: 'Eras', icon: Calendar },
  { id: 'genres', label: 'Genres', icon: Clapperboard },
  { id: 'people', label: 'People', icon: Users },
];

const bigNumbers = [
  { label: 'Total Watched', value: '1,492' },
  { label: 'Total Hours', value: '3,024' },
  { label: 'Rewatches', value: '184' },
  { label: 'Avg Rating', value: '3.8' },
];

const genreData = [
  { name: 'Drama', count: 482, percent: 32 },
  { name: 'Sci-Fi', count: 320, percent: 21 },
  { name: 'Thriller', count: 280, percent: 18 },
  { name: 'Action', count: 210, percent: 14 },
  { name: 'Horror', count: 120, percent: 8 },
  { name: 'Comedy', count: 80, percent: 7 },
];

const decadeData = [
  { name: '1970s', count: 45, height: '20%' },
  { name: '1980s', count: 120, height: '40%' },
  { name: '1990s', count: 240, height: '65%' },
  { name: '2000s', count: 380, height: '85%' },
  { name: '2010s', count: 450, height: '100%' },
  { name: '2020s', count: 257, height: '55%' },
];

const ratingData = [
  { stars: '1', count: 12, height: '5%' },
  { stars: '2', count: 45, height: '15%' },
  { stars: '3', count: 210, height: '45%' },
  { stars: '4', count: 480, height: '100%' },
  { stars: '5', count: 145, height: '35%' },
];

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-ink-950 text-smoke-200 font-sans pb-24">
      {/* Header & Controls */}
      <header className="sticky top-0 z-20 bg-ink-950/80 backdrop-blur-md border-b border-ink-800 pt-8 pb-4 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-smoke-100">Analytics</h1>
          <button className="flex items-center gap-2 bg-ink-900 border border-ink-800 px-4 py-2 rounded-lg text-sm text-smoke-300 hover:text-smoke-100 hover:border-purple-500/50 transition-colors w-fit">
            <Filter className="w-4 h-4" /> Global Filters (All Time)
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto flex overflow-x-auto hide-scrollbar gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  isActive 
                    ? 'border-purple-500 text-purple-400 bg-purple-500/5' 
                    : 'border-transparent text-smoke-400 hover:text-smoke-200 hover:bg-ink-900/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-smoke-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-16"
            >
              {/* Big Numbers */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {bigNumbers.map((stat, idx) => (
                  <div key={idx} className="bg-ink-900 p-6 rounded-2xl border border-ink-800">
                    <p className="text-sm text-smoke-400 mb-2">{stat.label}</p>
                    <p className="text-4xl font-light text-smoke-100">{stat.value}</p>
                  </div>
                ))}
              </section>

              <div className="grid lg:grid-cols-2 gap-8 md:gap-16">
                {/* Genres Chart */}
                <section className="bg-ink-900/50 p-6 rounded-2xl border border-ink-800">
                  <h3 className="text-lg font-medium text-smoke-100 mb-6 flex items-center gap-2">
                    Top Genres
                  </h3>
                  <div className="space-y-4">
                    {genreData.map((genre) => (
                      <div key={genre.name} className="relative">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-smoke-300">{genre.name}</span>
                          <span className="text-smoke-400">{genre.count}</span>
                        </div>
                        <div className="h-2 w-full bg-ink-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${genre.percent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-purple-500 rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Eras Chart */}
                <section className="bg-ink-900/50 p-6 rounded-2xl border border-ink-800">
                  <h3 className="text-lg font-medium text-smoke-100 mb-6 flex items-center gap-2">
                    Release Decades
                  </h3>
                  <div className="h-64 flex items-end justify-between gap-2 pt-8 border-b border-ink-800">
                    {decadeData.map((decade, idx) => (
                      <div key={decade.name} className="relative flex-1 flex flex-col items-center group">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: decade.height }}
                          transition={{ duration: 0.8, delay: idx * 0.1, ease: "easeOut" }}
                          className="w-full bg-ink-700 hover:bg-purple-600 rounded-t-sm transition-colors relative"
                        >
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs bg-ink-950 px-2 py-1 rounded text-smoke-200 pointer-events-none transition-opacity whitespace-nowrap z-10 border border-ink-800">
                             {decade.count} films
                           </div>
                        </motion.div>
                        <span className="text-[10px] md:text-xs text-smoke-400 mt-2 rotate-45 md:rotate-0 origin-left md:origin-center">{decade.name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Ratings Histogram */}
              <section className="bg-ink-900/50 p-8 rounded-2xl border border-ink-800">
                <h3 className="text-xl font-medium text-smoke-100 mb-8 text-center">Rating Distribution</h3>
                <div className="max-w-2xl mx-auto h-48 flex items-end justify-center gap-4 md:gap-8 border-b border-ink-800 pb-2">
                  {ratingData.map((rating, idx) => (
                    <div key={rating.stars} className="relative flex flex-col items-center w-12 group">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: rating.height }}
                        transition={{ duration: 0.8, delay: idx * 0.1, ease: "easeOut" }}
                        className="w-full bg-purple-500/80 hover:bg-purple-400 rounded-t-md transition-colors"
                      >
                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs bg-ink-950 px-2 py-1 rounded text-smoke-200 pointer-events-none transition-opacity border border-ink-800">
                           {rating.count}
                         </div>
                      </motion.div>
                      <div className="flex items-center mt-3 text-smoke-300">
                        {rating.stars} <Star className="w-3 h-3 ml-1 fill-smoke-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </motion.div>
          )}

          {activeTab !== 'overview' && (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-24 text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ink-900 mb-4">
                <BarChart3 className="w-8 h-8 text-ink-600" />
              </div>
              <h2 className="text-xl font-medium text-smoke-200 mb-2">Detailed {activeTab} analytics</h2>
              <p className="text-smoke-400 max-w-md mx-auto">
                This section is under construction. It will feature deep-dive visualisations into your {activeTab} data.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
