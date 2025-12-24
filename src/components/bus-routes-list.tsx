'use client';

import { useState, useMemo } from 'react';
import type { BusRoute } from '@/lib/bus-data';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Share2, Bus, Search, MapPin } from 'lucide-react';

type BusRoutesListProps = {
  allRoutes: BusRoute[];
};

export function BusRoutesList({ allRoutes }: BusRoutesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredRoutes = useMemo(() => {
    if (!searchTerm) return allRoutes;
    const lowercasedTerm = searchTerm.toLowerCase();
    return allRoutes.filter(
      (route) =>
        route.busNumber.toLowerCase().includes(lowercasedTerm) ||
        route.description.toLowerCase().includes(lowercasedTerm) ||
        route.stops.some((stop) => stop.toLowerCase().includes(lowercasedTerm))
    );
  }, [searchTerm, allRoutes]);

  const handleShare = async (route: BusRoute) => {
    const routeInfo = `Bus Route: ${route.busNumber}\nDescription: ${route.description}\nStops: ${route.stops.join(', ')}`;
    const shareText = `Check out this bus route in Mangalore:\n\n${routeInfo}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mangalore Bus Route: ${route.busNumber}`,
          text: shareText,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: 'Copied to Clipboard!',
          description: 'Route details copied. You can paste them anywhere.',
        });
      } catch (err) {
        toast({
          title: 'Failed to Copy',
          description: 'Could not copy route details to clipboard.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative max-w-lg mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by bus no, description, or stop..."
          className="pl-12 bg-card shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredRoutes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoutes.map((route) => (
            <Card key={route.id} className="flex flex-col hover:shadow-lg transition-shadow duration-200 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight">{route.description}</CardTitle>
                  <Badge className="bg-primary/10 text-primary border-primary/20 font-mono font-semibold shrink-0">
                    {route.busNumber}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1.5 text-xs">
                  <MapPin className="h-3.5 w-3.5" />
                  {route.stops[0]} → {route.stops[route.stops.length - 1]}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow pt-0">
                <Accordion type="single" collapsible>
                  <AccordionItem value="stops" className="border-none">
                    <AccordionTrigger className="text-sm py-2 hover:no-underline">
                      <span className="flex items-center gap-2">
                        <Bus className="h-4 w-4 text-primary" />
                        View {route.stops.length} Stops
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-2 border-l-2 border-primary/20 space-y-1.5 ml-2">
                        {route.stops.map((stop, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                            {stop}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" size="sm" onClick={() => handleShare(route)} className="w-full">
                  <Share2 className="h-4 w-4" />
                  Share Route
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16 rounded-2xl border border-dashed border-border/50 bg-secondary/30">
          <div className="p-4 rounded-full bg-muted/50 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Routes Found</h2>
          <p className="text-muted-foreground max-w-sm">
            No routes found for "{searchTerm}". Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
}
