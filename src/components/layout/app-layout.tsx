'use client';

import type { PropsWithChildren } from 'react';
import { FloatingDock } from './floating-dock';
import { BottomNav } from './bottom-nav';
import { ThemeToggle } from '@/components/theme-toggle';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Desktop Only - Hamburger and Theme Toggle */}
      <div className="hidden md:flex fixed top-0 left-0 right-0 z-40 items-center justify-between px-4 py-3">
        {/* Left - Hamburger Menu */}
        <FloatingDock />
        
        {/* Right - Theme Toggle */}
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </div>
  );
}
