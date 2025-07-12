'use client';

import { useState, useMemo } from 'react';
import type { BusRoute } from '@/lib/bus-data';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Share2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

  const handleShare = (route: BusRoute) => {
    const routeInfo = `Bus Route: ${route.busNumber}\nDescription: ${route.description}\nStops: ${route.stops.join(', ')}`;
    const emailBody = encodeURIComponent(`Check out this bus route in Mangalore:\n\n${routeInfo}`);
    window.location.href = `mailto:?subject=Mangalore Bus Route: ${route.busNumber}&body=${emailBody}`;
    toast({
      title: 'Ready to Share!',
      description: 'Your email client has been opened to share the route.',
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <Input
          type="search"
          placeholder="Search by bus no, description, or stop..."
          className="max-w-lg w-full bg-card"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredRoutes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoutes.map((route) => (
            <Card key={route.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{route.description}</span>
                  <Badge variant="outline" className="text-base">{route.busNumber}</Badge>
                </CardTitle>
                <CardDescription>
                  {route.stops[0]} to {route.stops[route.stops.length - 1]}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <Accordion type="single" collapsible>
                  <AccordionItem value="stops">
                    <AccordionTrigger>View Stops</AccordionTrigger>
                    <AccordionContent>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        {route.stops.map((stop, i) => (
                          <li key={i}>{stop}</li>
                        ))}
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="outline" size="sm" onClick={() => handleShare(route)} className="w-full">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p>No routes found for "{searchTerm}".</p>
          <p>Try a different search term.</p>
        </div>
      )}
    </div>
  );
}
