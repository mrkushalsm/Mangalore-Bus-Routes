'use client';

import { Settings as SettingsIcon, Moon, Sun, Github, Heart } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
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
      </div>
    </div>
  );
}
