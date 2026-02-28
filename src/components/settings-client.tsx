'use client';

import { Moon, Sun, Github, Heart, Bug, Lightbulb, ExternalLink } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SuggestCorrectionForm } from '@/components/suggest-correction-form';
import type { BusRoute } from '@/lib/bus-data';

interface SettingsClientProps {
  allRoutes: BusRoute[];
  allStops: { value: string; label: string }[];
}

export function SettingsClient({ allRoutes, allStops }: SettingsClientProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-full">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-transparent" />
        
        <div className="relative container mx-auto max-w-2xl px-4 py-8 sm:py-12">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Settings
            </h1>
            <p className="text-muted-foreground">
              Customize your app experience.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="container mx-auto max-w-2xl px-4 pb-8 space-y-4">
        {/* Appearance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Appearance</CardTitle>
            <CardDescription>Choose your preferred theme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant={mounted && theme === 'light' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setTheme('light')}
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={mounted && theme === 'dark' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setTheme('dark')}
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={mounted && theme === 'system' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setTheme('system')}
              >
                Auto
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">About</CardTitle>
            <CardDescription>Mangalore Bus Routes Finder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Find bus routes, get smart suggestions, and navigate Mangalore with ease. 
              Built to help students and tourists get around the city.
            </p>
            
            <div className="flex flex-col gap-2">
              <a
                href="https://github.com/mrkushalsm/Mangalore-Bus-Routes"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 text-red-500" />
                Built by Kushal SM
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Support & Feedback</CardTitle>
            <CardDescription>Help us improve the app!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="https://github.com/mrkushalsm/Mangalore-Bus-Routes/issues/new?labels=bug&template=bug_report.md&title=%5BBug%5D"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Bug className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Report a Bug</p>
                  <p className="text-xs text-muted-foreground">Found something broken? Let us know</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            </a>
            
            <a
              href="https://github.com/mrkushalsm/Mangalore-Bus-Routes/issues/new?labels=enhancement&template=feature_request.md&title=%5BFeature%5D"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Request a Feature</p>
                  <p className="text-xs text-muted-foreground">Have an idea? We'd love to hear it</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            </a>
            
            <SuggestCorrectionForm
              allRoutes={allRoutes}
              allStops={allStops}
              trigger={
                <button className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 transition-colors group text-left">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9h18M3 15h18M5 3v18M19 3v18" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium">Suggest Route Correction</p>
                      <p className="text-xs text-muted-foreground">Edit, add, or remove a bus route</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </button>
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
