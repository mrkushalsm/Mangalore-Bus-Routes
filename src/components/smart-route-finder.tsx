
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { smartRouteSuggestion, type SmartRouteSuggestionOutput } from '@/lib/smart-route-suggestion';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, ChevronsRight, Bus, Star, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { BusRoute } from '@/lib/bus-data';
import { useSavedRoutes } from '@/hooks/use-saved-routes';
import { AutoComplete } from '@/components/ui/autocomplete';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formSchema = z.object({
  sourceStop: z.string().min(1, { message: 'Please select a source stop.' }),
  destinationStop: z.string().min(1, { message: 'Please select a destination stop.' }),
});

type RouteSegment = NonNullable<SmartRouteSuggestionOutput['routes']>[0]['segments'][0];

interface SmartRouteFinderProps {
  busRoutes: BusRoute[];
}

export function SmartRouteFinder({ busRoutes }: SmartRouteFinderProps) {
  const [suggestion, setSuggestion] = useState<SmartRouteSuggestionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Pagination state: grouped by transfer count key (e.g., "0", "1") -> number of visible items
  const [visibleCount, setVisibleCount] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const { toggleSaveRoute, isRouteSaved } = useSavedRoutes();

  const allStops = useMemo(() => {
    const stops = new Set<string>();
    busRoutes.forEach(route => {
        route.stops.forEach(stop => {
            stops.add(stop);
        });
    });
    return Array.from(stops).sort().map(stop => ({ value: stop, label: stop }));
  }, [busRoutes]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceStop: '',
      destinationStop: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.sourceStop.toLowerCase() === values.destinationStop.toLowerCase()) {
        form.setError("destinationStop", { message: "Source and destination cannot be the same." });
        return;
    }
    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    setVisibleCount({});
    try {
      const result = await smartRouteSuggestion(values);
      setSuggestion(result);
      
      // Initialize visibility for all potential groups
      if (result.isRoutePossible && result.routes) {
         const updates: Record<string, number> = {};
         result.routes.forEach(r => {
             const key = (r.segments.length - 1).toString();
             if (!updates[key]) updates[key] = 5;
         });
         setVisibleCount(updates);
      }

    } catch (e) {
      console.error(e);
      setError('Failed to get route suggestion. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleSaveRoute = (route: NonNullable<SmartRouteSuggestionOutput['routes']>[0]) => {
    let savedCount = 0;
    route.segments.forEach(segment => {
        const bus = busRoutes.find(r => r.busNumber === segment.busNumber);
        if (bus && !isRouteSaved(bus.id)) {
            toggleSaveRoute(bus.id);
            savedCount++;
        }
    });
    if (savedCount > 0) {
        toast({
            title: "Route Saved!",
            description: `Added ${savedCount} new bus route(s) to your saved list.`
        });
    } else {
        toast({
            title: "Already Saved",
            description: "All buses in this route are already in your saved list."
        });
    }
  }
  
  const isSuggestedRouteSaved = (route: NonNullable<SmartRouteSuggestionOutput['routes']>[0]) => {
    return route.segments.every(segment => {
        const bus = busRoutes.find(r => r.busNumber === segment.busNumber);
        return bus ? isRouteSaved(bus.id) : false;
    });
  }

  const loadMore = (key: string) => {
      setVisibleCount(prev => ({
          ...prev,
          [key]: (prev[key] || 5) + 5
      }));
  };

  const SegmentStopsDialog = ({ segment }: { segment: RouteSegment }) => (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex flex-col items-center p-3 rounded-lg bg-secondary/50 border cursor-pointer hover:bg-secondary transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <Bus className="h-5 w-5 text-primary" />
            <Badge variant="outline" className="text-base">{segment.busNumber}</Badge>
          </div>
          <div className="text-sm text-muted-foreground text-center">
            <span className="font-medium text-foreground">{segment.startStop}</span> to <span className="font-medium text-foreground">{segment.endStop}</span>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bus {segment.busNumber} Stops</DialogTitle>
          <CardDescription>{segment.startStop} to {segment.endStop}</CardDescription>
        </DialogHeader>
        <div className="py-4">
            <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-2">
                {segment.stops.map((stop, index) => (
                    <li key={index} className="mb-6 ml-6">
                        <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">
                            <Bus className="w-3 h-3 text-blue-800 dark:text-blue-300"/>
                        </span>
                        <h3 className="flex items-center mb-1 text-base font-semibold text-gray-900 dark:text-white">
                            {stop}
                            {(stop === segment.startStop || stop === segment.endStop) && (
                                <Badge variant={stop === segment.startStop ? 'default': 'destructive'} className="ml-3">{stop === segment.startStop ? 'Board' : 'Alight'}</Badge>
                            )}
                        </h3>
                    </li>
                ))}
            </ol>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Group routes by transfer count
  const groupedRoutes = useMemo(() => {
      if (!suggestion?.routes) return {};
      const groups: Record<number, typeof suggestion.routes> = {};
      suggestion.routes.forEach(route => {
          const transfers = route.segments.length - 1;
          if (!groups[transfers]) groups[transfers] = [];
          groups[transfers].push(route);
      });
      return groups;
  }, [suggestion]);

  const sortedTransferKeys = useMemo(() => {
      return Object.keys(groupedRoutes).map(Number).sort((a,b) => a - b);
  }, [groupedRoutes]);

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="sourceStop"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Bus Stop</FormLabel>
                  <FormControl>
                    <AutoComplete 
                        options={allStops}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select a source stop..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destinationStop"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination Bus Stop</FormLabel>
                  <FormControl>
                    <AutoComplete 
                        options={allStops}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select a destination stop..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Find Routes
          </Button>
        </form>
      </Form>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {suggestion && (
        <Card className="mt-6 animate-in fade-in">
          <CardHeader>
            <CardTitle>Suggested Routes</CardTitle>
            <CardDescription>
                {suggestion.isRoutePossible 
                    ? `Found ${suggestion.routes.length} possible route(s).`
                    : "No direct or single-transfer route could be found."
                }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestion.isRoutePossible && suggestion.routes.length > 0 ? (
                <Tabs defaultValue={sortedTransferKeys[0]?.toString()} className="w-full">
                    <TabsList className="flex flex-wrap h-auto">
                        {sortedTransferKeys.map(transfers => (
                            <TabsTrigger key={transfers} value={transfers.toString()}>
                                {transfers === 0 ? 'Direct' : `${transfers} Transfer${transfers > 1 ? 's' : ''}`}
                                <Badge variant="secondary" className="ml-2">{groupedRoutes[transfers].length}</Badge>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    
                    {sortedTransferKeys.map(transfers => {
                        const routesInGroup = groupedRoutes[transfers];
                        const visible = visibleCount[transfers.toString()] || 5;
                        const shownRoutes = routesInGroup.slice(0, visible);
                        const hasMore = visible < routesInGroup.length;

                        return (
                            <TabsContent key={transfers} value={transfers.toString()} className="space-y-6 mt-6">
                                {shownRoutes.map((route, routeIndex) => (
                                    <div key={routeIndex} className='p-4 border rounded-lg relative'>
                                        <div className="flex items-center justify-center flex-wrap gap-2 text-center">
                                            {route.segments.map((segment, index) => (
                                                <div key={index} className="flex items-center flex-wrap gap-2 justify-center">
                                                    {index > 0 && (
                                                        <div className="flex flex-col items-center mx-2 text-muted-foreground">
                                                            <ChevronsRight className="h-6 w-6" />
                                                            <span className="text-xs">Transfer at</span>
                                                            <span className="text-xs font-semibold">{route.segments[index-1].endStop}</span>
                                                        </div>
                                                    )}
                                                    <SegmentStopsDialog segment={segment} />
                                                </div>
                                            ))}
                                        </div>
                                         <Button
                                            variant={isSuggestedRouteSaved(route) ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleSaveRoute(route)}
                                            className="absolute top-3 right-3"
                                        >
                                            <Star className={`mr-2 h-4 w-4 ${isSuggestedRouteSaved(route) ? 'fill-current text-yellow-400' : ''}`} />
                                            {isSuggestedRouteSaved(route) ? 'Saved' : 'Save'}
                                        </Button>
                                        <div className="mt-4 text-xs text-center text-muted-foreground">
                                            Total Stops: {route.segments.reduce((acc, s) => acc + s.stops.length, 0)}
                                        </div>
                                    </div>
                                ))}
                                
                                {hasMore && (
                                    <div className="flex justify-center pt-4">
                                        <Button variant="outline" onClick={() => loadMore(transfers.toString())}>
                                            <ChevronDown className="mr-2 h-4 w-4" />
                                            Show 5 More
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>
                        );
                    })}
                </Tabs>
            ) : (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Route Found</AlertTitle>
                    <AlertDescription>{suggestion.reasoning}</AlertDescription>
                </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
