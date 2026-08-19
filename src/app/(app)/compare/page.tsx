'use client';

import React, { useState } from 'react';

export default function ComparePage() {
  const [target, setTarget] = useState('');

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-4">Taste Comparison</h1>
        <p className="text-slate-400">Compare your cinematic footprint with others.</p>
        
        <div className="mt-8 max-w-md mx-auto flex gap-2">
          <select 
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select a profile to compare...</option>
            <option value="demo1">Demo User 1</option>
            <option value="demo2">Demo User 2</option>
          </select>
          <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors">
            Compare
          </button>
        </div>
      </header>

      {target && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col items-center justify-center text-center">
              <h3 className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">Compatibility Score</h3>
              <div className="text-6xl font-bold text-purple-400">84%</div>
              <p className="text-slate-500 text-xs mt-4">Based on Spearman rank correlation of co-rated titles.</p>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col items-center justify-center text-center">
              <h3 className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">Library Overlap</h3>
              <div className="text-5xl font-bold text-white">23%</div>
              <p className="text-slate-500 text-xs mt-4">142 shared watched titles. Jaccard index similarity.</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Biggest Disagreements</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800/50">
                <span className="font-medium text-slate-200">The Matrix Resurrections</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-purple-400">You: 4.5</span>
                  <span className="text-slate-500">Them: 2.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
