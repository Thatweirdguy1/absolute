'use client';

import { Navigation } from '@/components/layout/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-ink-950 text-smoke-100">
      <Navigation />
      <main 
        id="main-content" 
        className="flex-1 overflow-y-auto min-h-screen"
        role="main"
      >
        {children}
      </main>
    </div>
  );
}
