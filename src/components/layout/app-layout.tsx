'use client';

import type { PropsWithChildren } from 'react';
import { FloatingDock } from './floating-dock';
import { BottomNav } from './bottom-nav';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Desktop Only - Hamburger Menu */}
      <div className="hidden md:flex fixed top-0 left-0 z-40 px-4 py-3">
        <FloatingDock />
      </div>

      {/* Main Content */}
      <main className="flex-1 mb-16 md:mb-0">
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </div>
  );
}
