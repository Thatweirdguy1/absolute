'use client';

import React from 'react';
import { Filter } from 'lucide-react';

export default function CommunityPage() {
  const topRated = [
    { rank: 1, title: 'Parasite', year: 2019, weightedRating: 4.8, voteCount: 45, communityAvg: 3.8 },
    { rank: 2, title: 'Everything Everywhere All at Once', year: 2022, weightedRating: 4.7, voteCount: 38, communityAvg: 3.8 },
    { rank: 3, title: 'Spirited Away', year: 2001, weightedRating: 4.6, voteCount: 42, communityAvg: 3.8 },
    { rank: 4, title: 'The Godfather', year: 1972, weightedRating: 4.6, voteCount: 35, communityAvg: 3.8 },
    { rank: 5, title: 'Pulp Fiction', year: 1994, weightedRating: 4.5, voteCount: 40, communityAvg: 3.8 },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Community Ratings</h1>
          <p className="text-slate-400">Top rated movies based on aggregate ratings from Absolute users.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:bg-slate-800">
          <Filter size={18} /> Filters
        </button>
      </header>

      <div className="bg-slate-900/50 border border-purple-500/20 p-4 rounded-xl mb-8 flex items-start gap-3 text-sm text-purple-200/80">
        <div className="bg-purple-900/50 p-1.5 rounded-md shrink-0">ℹ️</div>
        <div>
          <p className="font-medium text-purple-100 mb-1">Ratings from Absolute users only. Not blended with TMDB or IMDb.</p>
          <p>We use a Bayesian weighted rating system to ensure fairness. Minimum 3 votes required to chart.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 font-medium w-16 text-center">#</th>
              <th className="px-6 py-4 font-medium">Title</th>
              <th className="px-6 py-4 font-medium text-right">Weighted Rating</th>
              <th className="px-6 py-4 font-medium text-right text-slate-500 hidden md:table-cell">Votes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {topRated.map((item) => (
              <tr key={item.rank} className="hover:bg-slate-800/50 group">
                <td className="px-6 py-4 text-center font-mono text-purple-400 font-bold">{item.rank}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-14 bg-slate-800 rounded overflow-hidden shrink-0"></div>
                    <div>
                      <div className="font-bold text-slate-200 text-base">{item.title}</div>
                      <div className="text-slate-500 text-xs">{item.year}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="font-bold text-white text-lg">{item.weightedRating.toFixed(2)}</div>
                </td>
                <td className="px-6 py-4 text-right text-slate-500 hidden md:table-cell">
                  {item.voteCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
