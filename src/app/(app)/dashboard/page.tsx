'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Play, Clock, Star, Globe, ChevronRight, Activity, TrendingUp, Compass, Search } from 'lucide-react';

const stats = [
  { label: 'Total Films', value: '1,492', icon: Play, trend: '+12 this month' },
  { label: 'Hours Watched', value: '3,024', icon: Clock, trend: '+28h this month' },
  { label: 'Avg Rating', value: '3.8', icon: Star, trend: '+0.1 this year' },
  { label: 'Countries', value: '42', icon: Globe, trend: '+2 new' },
];

const recentActivity = [
  { id: 1, title: 'Dune: Part Two', rating: 4.5, date: '2 days ago', poster: 'bg-ink-800' },
  { id: 2, title: 'Poor Things', rating: 5, date: '4 days ago', poster: 'bg-ink-700' },
  { id: 3, title: 'Past Lives', rating: 4, date: '1 week ago', poster: 'bg-ink-800' },
  { id: 4, title: 'Oppenheimer', rating: 4.5, date: '2 weeks ago', poster: 'bg-ink-700' },
  { id: 5, title: 'Anatomy of a Fall', rating: 4, date: '3 weeks ago', poster: 'bg-ink-800' },
];

const insights = [
  { title: 'Denis Villeneuve Streak', description: 'You have watched 3 films by Denis Villeneuve in the last 7 days.', type: 'director' },
  { title: 'Sci-Fi Surge', description: 'Your Sci-Fi viewing is up 40% compared to last month.', type: 'genre' },
  { title: 'Slow Paced Era', description: 'Average film length watched this week is 145 mins.', type: 'pacing' },
];

const exploreLinks = [
  { title: 'Detailed Stats', href: '/stats', icon: Activity, description: 'Deep dive into your viewing patterns' },
  { title: 'History Log', href: '/history', icon: Clock, description: 'Review your complete timeline' },
  { title: 'Your Rankings', href: '/rankings', icon: Star, description: 'See your top rated films' },
  { title: 'Import Data', href: '/import', icon: Search, description: 'Sync from Letterboxd or IMDb' },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-ink-950 text-smoke-200 font-sans pb-24">
      {/* Hero Section */}
      <section className="relative px-6 py-20 md:px-12 lg:px-24 border-b border-ink-800 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-ink-950 to-ink-950 -z-10"></div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-7xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-smoke-100 tracking-tight mb-4">
            Your Cinematic <span className="text-purple-400">Fingerprint</span>
          </h1>
          <p className="text-lg md:text-xl text-smoke-400 max-w-2xl mb-12">
            A real-time reflection of your taste, time, and journey through cinema.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + (idx * 0.1) }}
                  className="bg-ink-900/50 backdrop-blur-sm p-6 rounded-2xl border border-ink-800 hover:border-purple-500/50 transition-colors"
                >
                  <Icon className="w-6 h-6 text-purple-400 mb-4" />
                  <p className="text-sm text-smoke-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-smoke-100 mb-2">{stat.value}</p>
                  <p className="text-xs text-purple-300/80">{stat.trend}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16 space-y-24">
        {/* Recent Activity Rail */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-smoke-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" /> Recent Activity
            </h2>
            <Link href="/history" className="text-sm text-purple-400 hover:text-purple-300 flex items-center transition-colors">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 snap-x hide-scrollbar">
            {recentActivity.map((film, idx) => (
              <motion.div 
                key={film.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="snap-start shrink-0 w-32 md:w-48 group cursor-pointer"
              >
                <div className={`aspect-[2/3] ${film.poster} rounded-xl mb-3 shadow-lg border border-ink-800 group-hover:border-purple-500/50 transition-all group-hover:-translate-y-1 relative overflow-hidden`}>
                   <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                     <div className="flex items-center gap-1">
                       <Star className="w-4 h-4 fill-purple-400 text-purple-400" />
                       <span className="text-sm font-medium text-smoke-100">{film.rating}</span>
                     </div>
                   </div>
                </div>
                <h3 className="text-sm font-medium text-smoke-200 truncate">{film.title}</h3>
                <p className="text-xs text-smoke-400">{film.date}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-16">
          {/* Insights */}
          <section>
            <h2 className="text-2xl font-semibold text-smoke-100 mb-8 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" /> AI Insights
            </h2>
            <div className="space-y-4">
              {insights.map((insight, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + (idx * 0.1) }}
                  className="bg-ink-900 rounded-xl p-5 border border-ink-800"
                >
                  <h3 className="text-base font-medium text-purple-300 mb-1">{insight.title}</h3>
                  <p className="text-sm text-smoke-400 leading-relaxed">{insight.description}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Continue Exploring */}
          <section>
            <h2 className="text-2xl font-semibold text-smoke-100 mb-8 flex items-center gap-2">
              <Compass className="w-5 h-5 text-purple-400" /> Continue Exploring
            </h2>
            <div className="grid gap-4">
              {exploreLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link href={link.href} key={link.title}>
                    <motion.div 
                      whileHover={{ x: 4 }}
                      className="group bg-ink-900 rounded-xl p-5 border border-ink-800 hover:border-purple-500/50 flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-ink-800 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                          <Icon className="w-5 h-5 text-smoke-300 group-hover:text-purple-400 transition-colors" />
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-smoke-200 group-hover:text-smoke-100">{link.title}</h3>
                          <p className="text-xs text-smoke-400">{link.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-ink-600 group-hover:text-purple-400 transition-colors" />
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
