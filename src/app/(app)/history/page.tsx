'use client';

import React, { useState, useEffect } from 'react';
import { LayoutGrid, List as ListIcon, Calendar, Filter, Star } from 'lucide-react';
import { getHistory, HistoryEvent } from '@/lib/tauri-api';

export default function HistoryPage() {
  const [view, setView] = useState<'grid' | 'list' | 'timeline'>('grid');
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  
  useEffect(() => {
    async function load() {
      try {
        const data = await getHistory();
        setHistory(data);
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
    load();
  }, []);

  const filteredHistory = history.filter(item => item.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">History</h1>
          <p className="text-slate-400">Your browsable library of watched titles.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button onClick={() => setView('grid')} className={`p-2 rounded-md ${view === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}><LayoutGrid size={20} /></button>
          <button onClick={() => setView('list')} className={`p-2 rounded-md ${view === 'list' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}><ListIcon size={20} /></button>
          <button onClick={() => setView('timeline')} className={`p-2 rounded-md ${view === 'timeline' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}><Calendar size={20} /></button>
        </div>
      </header>

      <div className="flex gap-4 mb-8">
        <input 
          type="text" 
          placeholder="Search titles..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:bg-slate-800">
          <Filter size={18} /> Filters
        </button>
      </div>

      {view === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredHistory.map(item => (
            <div key={item.id} className="aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden relative group cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all flex flex-col items-center justify-center text-center p-2">
              <span className="text-slate-500 text-sm italic">No Poster Yet</span>
              <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-sm font-semibold truncate text-white">{item.title}</p>
                {item.rating_value && <p className="text-xs text-purple-400 flex items-center gap-1"><Star size={10} /> {item.rating_value / 2}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'list' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Watched Date</th>
                <th className="px-4 py-3 font-medium">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredHistory.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/50 cursor-pointer">
                  <td className="px-4 py-3 font-medium text-slate-200">
                    {item.title} <span className="text-slate-500 text-xs ml-2">{item.release_year || ''}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{item.watched_date || 'Unknown'}</td>
                  <td className="px-4 py-3 text-purple-400">{item.rating_value ? item.rating_value / 2 : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredHistory.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <LayoutGrid className="mx-auto h-12 w-12 mb-4 opacity-20" />
          <p>No history found.</p>
        </div>
      )}
    </div>
  );

}
