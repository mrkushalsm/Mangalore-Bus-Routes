'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bus, Star, Settings, GitPullRequest } from 'lucide-react';
import { cn } from '@/lib/utils';

export const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/routes', label: 'Routes', icon: Bus },
  { href: '/saved', label: 'Saved', icon: Star },
  { href: '/corrections', label: 'Corrections', icon: GitPullRequest },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-bottom">
      <div className="bg-card border-t border-border">
        <div className="flex items-center justify-around py-1.5 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-colors duration-200',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[10px] leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
