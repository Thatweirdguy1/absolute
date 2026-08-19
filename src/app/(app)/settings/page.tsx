'use client';

import React, { useState } from 'react';

export default function SettingsPage() {
  const [deleteConfirm, setDeleteConfirm] = useState(0);

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-10">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your data, preferences, and account.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white border-b border-slate-800 pb-2">Profile & Preferences</h2>
        <div className="grid gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Display Name</label>
            <input type="text" defaultValue="Cinephile" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Rating System</label>
            <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500">
              <option>5 Stars (0.5 increments)</option>
              <option>10 Point Scale</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white border-b border-slate-800 pb-2">External Integrations</h2>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">TMDB API Read Access Token (v4)</label>
            <p className="text-xs text-slate-500 mb-3">Absolute uses your own API token to match titles. This is securely stored in your OS credential vault.</p>
            <div className="flex gap-2">
              <input 
                type="password" 
                id="tmdbTokenInput"
                placeholder="eyJh..." 
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 font-mono text-sm" 
              />
              <button 
                onClick={async () => {
                  const el = document.getElementById('tmdbTokenInput') as HTMLInputElement;
                  if (!el.value) return;
                  const { saveTmdbToken } = await import('@/lib/tauri-api');
                  try {
                    const success = await saveTmdbToken(el.value);
                    if (success) alert('Token validated and saved securely!');
                    else alert('Token is invalid or expired.');
                  } catch (e) {
                    alert('Error saving token: ' + String(e));
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors text-sm font-medium"
              >
                Save & Verify
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white border-b border-slate-800 pb-2">Data & Import History</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Rows</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr className="hover:bg-slate-800/50">
                <td className="px-4 py-3 text-slate-300">2026-08-19</td>
                <td className="px-4 py-3 text-slate-300">Letterboxd CSV</td>
                <td className="px-4 py-3 text-slate-300">1,240</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-red-400 hover:text-red-300 text-xs font-medium">Undo Import</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex gap-4 pt-2">
          <button className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium">
            Export All Data (JSON)
          </button>
        </div>
      </section>

      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-semibold text-red-500 border-b border-red-900/30 pb-2">Danger Zone</h2>
        <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-xl">
          <p className="text-sm text-red-200/70 mb-4">
            Once you delete your account data, there is no going back. Please be certain.
          </p>
          {deleteConfirm === 0 ? (
            <button 
              onClick={() => setDeleteConfirm(1)}
              className="px-4 py-2 bg-red-900/50 text-red-200 rounded-lg hover:bg-red-900 transition-colors text-sm font-medium border border-red-800"
            >
              Delete All Data
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Type DELETE to confirm" 
                className="bg-slate-950 border border-red-900 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500"
              />
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Confirm Deletion
              </button>
              <button 
                onClick={() => setDeleteConfirm(0)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>

      <footer className="pt-12 pb-4 text-center text-xs text-slate-600">
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        <p className="mt-1">Absolute Cinema App v1.0.0</p>
      </footer>
    </div>
  );
}
