'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getProfile, createProfile } from '@/lib/tauri-api';

export default function WelcomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    async function checkProfile() {
      // Small timeout to allow Tauri API injection if it's slightly delayed
      setTimeout(async () => {
        try {
          const profile = await getProfile();
          if (profile) {
            router.push('/dashboard');
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error("Not running in Tauri or error:", error);
          setLoading(false); // Assume first run or mock mode
        }
      }, 100);
    }
    checkProfile();
  }, [router]);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    
    setLoading(true);
    try {
      await createProfile(displayName);
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-ink-950 flex items-center justify-center"><div className="skeleton w-32 h-32 rounded-full"></div></div>;
  }

  return (
    <div className="min-h-screen bg-ink-950 text-smoke-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background grain & gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-ink-900 to-ink-950 z-0"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-lg w-full glass p-10 rounded-2xl glow-purple-sm"
      >
        <h1 className="text-6xl text-purple-400 mb-2 font-display tracking-wide">ABSOLUTE</h1>
        <p className="text-xl text-smoke-300 mb-8">Your cinema. Quantified.</p>
        
        <div className="mb-8 space-y-4 text-smoke-200">
          <p>
            Welcome to your private cinematic observatory.
          </p>
          <p>
            Absolute is a local-first application. Your viewing history, ratings, and analytics <strong>never leave your device</strong> unless you explicitly export them. There are no accounts, no subscriptions, and no analytics tracking you.
          </p>
        </div>

        <form onSubmit={handleCreateProfile} className="space-y-6">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-smoke-300 mb-2">
              What should we call you?
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Cinephile"
              className="w-full bg-ink-900 border border-ink-700 focus:border-purple-500 rounded-lg p-3 text-smoke-100 outline-none transition-colors"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-lg transition-all glow-purple-sm"
          >
            Create Local Profile
          </button>
        </form>
      </motion.div>
    </div>
  );
}
