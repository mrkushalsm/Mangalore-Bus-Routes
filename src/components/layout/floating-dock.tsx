'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Bus, Github, Star, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Route Finder', icon: Search },
  { href: '/routes', label: 'All Routes', icon: Bus },
  { href: '/saved', label: 'Saved Journeys', icon: Star },
];

export function FloatingDock() {
  const [isOpen, setIsOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dock when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dockRef.current && !dockRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dock on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close dock on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      {/* Hamburger trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-fade-in md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Floating Dock */}
      <div
        ref={dockRef}
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full glass-card rounded-r-2xl shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border/50">
            <Link 
              href="/" 
              className="flex items-center gap-3 group"
              onClick={() => setIsOpen(false)}
            >
              <Bus className="h-7 w-7 text-primary" />
              <div>
                <h1 className="text-lg font-bold">Mangalore Buses</h1>
                <p className="text-xs text-muted-foreground">Find your route</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-foreground hover:bg-secondary'
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
              <p>
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
              <a
                href="https://github.com/mrkushalsm/Mangalore-Bus-Routes"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-medium hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
