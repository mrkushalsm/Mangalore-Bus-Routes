'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bus, Github, Star, Search, Bug, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Route Finder', icon: Search },
  { href: '/routes', label: 'All Routes', icon: Bus },
  { href: '/saved', label: 'Saved Journeys', icon: Star },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function FloatingDock() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex h-full w-64 flex-col border-r border-border/50 bg-card/50 backdrop-blur-sm">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <Link 
          href="/" 
          className="flex items-center gap-3 group"
        >
          <Bus className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
          <div>
            <h1 className="text-lg font-bold">Mangalore Buses</h1>
            <p className="text-xs text-muted-foreground">Find your route</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-foreground hover:bg-secondary/80'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        {/* Credits */}
        <div className="px-4 space-y-2 text-xs text-muted-foreground">
          <a
            href="https://github.com/mrkushalsm/Mangalore-Bus-Routes/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-medium hover:text-foreground transition-colors py-1"
          >
            <Bug className="h-4 w-4" />
            Report an Issue
          </a>
          <a
            href="https://github.com/mrkushalsm/Mangalore-Bus-Routes"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-medium hover:text-foreground transition-colors py-1"
          >
            <Github className="h-4 w-4" />
            View on GitHub
          </a>
          <p className="pt-1 border-t border-border/50">
            Built by{' '}
            <a
              href="https://github.com/mrkushalsm"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Kushal SM
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
