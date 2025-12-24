'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bus, Star, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/routes', label: 'Routes', icon: Bus },
  { href: '/saved', label: 'Saved', icon: Star },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-bottom">
      <div className="bg-card border-t border-border">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors duration-200',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
