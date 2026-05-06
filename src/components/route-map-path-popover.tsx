'use client';

import { useState } from 'react';
import { Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RouteShareDialog } from '@/components/route-share-dialog';
import type { SmartRouteSuggestionOutput } from '@/lib/smart-route-suggestion';

type SuggestedRoute = NonNullable<SmartRouteSuggestionOutput['routes']>[0];

interface RouteMapPathPopoverProps {
  routes: SuggestedRoute[];
  getRouteIndex: (route: SuggestedRoute) => number;
  getShareUrl: (route: SuggestedRoute) => string;
  onSelectRoute: (route: SuggestedRoute, routeIndex: number) => void;
}

export function RouteMapPathPopover({ routes, getRouteIndex, getShareUrl, onSelectRoute }: RouteMapPathPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => e.stopPropagation()}
          className="h-7 w-7"
          title="Choose path to view on map"
        >
          <Map className="h-3.5 w-3.5 text-primary" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(92vw,24rem)] p-2" side="top" align="end">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground mb-2">Choose a path</p>
          {routes.map((route, idx) => {
            const busSequence = route.segments.map((s) => s.busNumber).join(' -> ');
            const firstSegment = route.segments[0];
            const lastSegment = route.segments[route.segments.length - 1];
            const routeIndex = getRouteIndex(route);

            return (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-md border p-2 transition-colors hover:bg-secondary/50"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRoute(route, routeIndex);
                    setOpen(false);
                  }}
                  className="flex min-w-0 flex-1 items-start text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{busSequence}</p>
                    <p className="text-xs text-muted-foreground">
                      {firstSegment.startStop}
                      {' -> '}
                      {lastSegment.endStop}
                    </p>
                  </div>
                </button>
                <RouteShareDialog
                  route={route}
                  shareUrl={getShareUrl(route)}
                  triggerClassName="h-7 w-7 shrink-0"
                />
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
