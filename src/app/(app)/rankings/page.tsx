'use client';

import React, { useState } from 'react';

export default function RankingsPage() {
  const [view, setView] = useState<'all-time' | 'year'>('all-time');
  
  // Dummy data
  const tiers = [
    { rating: 5.0, count: 12, titles: ['The Godfather', 'Spirited Away', 'Parasite'] },
    { rating: 4.5, count: 28, titles: ['Dune', 'Everything Everywhere All at Once'] },
    { rating: 4.0, count: 45, titles: ['Tenet', 'Blade Runner 2049'] },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Personal Rankings</h1>
          <p className="text-slate-400 text-sm">Rankings are based on your personal ratings only. TMDB and IMDb scores do not affect your order.</p>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button onClick={() => setView('all-time')} className={`px-4 py-1.5 rounded-md text-sm font-medium ${view === 'all-time' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>All-Time</button>
          <button onClick={() => setView('year')} className={`px-4 py-1.5 rounded-md text-sm font-medium ${view === 'year' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>This Year</button>
        </div>
      </header>

      <div className="space-y-12">
        {tiers.map((tier) => (
          <div key={tier.rating}>
            <div className="flex items-center gap-4 mb-4 border-b border-slate-800 pb-2">
              <h2 className="text-2xl font-bold text-purple-400">{tier.rating} ★</h2>
              <span className="text-slate-500 text-sm">{tier.count} titles</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tier.titles.map((title, idx) => (
                <div key={title} className="bg-slate-900 border border-slate-800 rounded-lg p-3 group hover:border-purple-500/50 transition-colors cursor-move relative flex flex-col h-40 justify-end overflow-hidden">
                  <div className="absolute top-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-xs font-mono text-purple-300">
                    #{idx + 1}
                  </div>
                  <div className="font-medium text-sm text-slate-200 line-clamp-2 z-10">{title}</div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
