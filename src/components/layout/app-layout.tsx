'use client';

import type { PropsWithChildren } from 'react';
import { FloatingDock } from './floating-dock';
import { BottomNav } from './bottom-nav';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 min-h-screen relative w-full">
        {/* Desktop Sidebar - Static */}
        <aside className="hidden md:block sticky top-0 h-screen shrink-0">
          <FloatingDock />
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full min-w-0 mb-16 md:mb-0">
          {children}
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </div>
  );
}
