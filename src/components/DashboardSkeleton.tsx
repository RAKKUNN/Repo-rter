import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Skeleton */}
      <aside className="w-72 border-r border-glass-border bg-glass backdrop-blur-xl flex flex-col h-full opacity-50">
        <div className="p-6 border-b border-glass-border">
          <div className="h-8 bg-foreground/10 animate-pulse w-3/4 rounded-none"></div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="h-4 bg-foreground/10 animate-pulse w-1/3 rounded-none mb-6"></div>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-10 bg-[var(--pixel-panel-bg)] border-2 border-[var(--pixel-border)] animate-pulse w-full rounded-none"></div>
          ))}
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 flex flex-col h-full bg-background overflow-hidden opacity-50">
        {/* Header Skeleton */}
        <header className="p-6 border-b border-glass-border flex justify-between items-center bg-glass backdrop-blur-xl z-10">
          <div className="h-8 bg-foreground/10 animate-pulse w-1/4 rounded-none"></div>
          <div className="flex gap-4">
            <div className="h-10 w-24 bg-[var(--pixel-panel-bg)] border-2 border-[var(--pixel-border)] animate-pulse rounded-none"></div>
            <div className="h-10 w-10 bg-[var(--pixel-panel-bg)] border-2 border-[var(--pixel-border)] animate-pulse rounded-none"></div>
          </div>
        </header>

        {/* Dashboard Content Skeleton */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 glass-panel border-4 border-[var(--pixel-border)] animate-pulse"></div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-[380px] glass-panel border-4 border-[var(--pixel-border)] animate-pulse"></div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 glass-panel border-4 border-[var(--pixel-border)] animate-pulse"></div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
