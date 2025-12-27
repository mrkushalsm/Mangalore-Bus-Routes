
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { smartRouteSuggestion, type SmartRouteSuggestionOutput } from '@/lib/smart-route-suggestion';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, ChevronsRight, Bus, Star, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { BusRoute } from '@/lib/bus-data';
import { useSavedJourneys } from '@/hooks/use-saved-journeys';
import { AutoComplete } from '@/components/ui/autocomplete';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const formSchema = z.object({
  sourceStop: z.string().min(1, { message: 'Please select a source stop.' }),
  destinationStop: z.string().min(1, { message: 'Please select a destination stop.' }),
});

type RouteSegment = NonNullable<SmartRouteSuggestionOutput['routes']>[0]['segments'][0];
type SuggestedRoute = NonNullable<SmartRouteSuggestionOutput['routes']>[0];

interface SmartRouteFinderProps {
  busRoutes: BusRoute[];
}

export function SmartRouteFinder({ busRoutes }: SmartRouteFinderProps) {
  const [suggestion, setSuggestion] = useState<SmartRouteSuggestionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<Record<string, number>>({});
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { addJourney, removeJourney, isJourneySaved } = useSavedJourneys();

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
    setOpenAccordions(new Set());
    try {
      const result = await smartRouteSuggestion(values);
      setSuggestion(result);
      
      if (result.isRoutePossible && result.routes) {
         const updates: Record<string, number> = {};
         result.routes.forEach(r => {
             const key = (r.segments.length - 1).toString();
             if (!updates[key]) updates[key] = 10;
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

  // Generate a stable ID for a route based on its segments
  const getJourneyId = (route: SuggestedRoute) => {
    return route.segments.map(s => `${s.busNumber}-${s.startStop}-${s.endStop}`).join('|');
  };

  const handleSaveRoute = (route: SuggestedRoute) => {
    const journeyId = getJourneyId(route);
    const sourceStop = form.getValues('sourceStop');
    const destinationStop = form.getValues('destinationStop');
    
    if (isJourneySaved(journeyId)) {
      removeJourney(journeyId);
      toast({
        title: "Journey Removed",
        description: "The journey has been removed from your saved list."
      });
    } else {
      addJourney({
        ...route,
        id: journeyId,
        sourceStop,
        destinationStop,
      });
      toast({
        title: "Journey Saved!",
        description: "You can view it on the Saved Journeys page."
      });
    }
  }
  
  const isSuggestedRouteSaved = (route: SuggestedRoute) => {
    const journeyId = getJourneyId(route);
    return isJourneySaved(journeyId);
  }

  const loadMore = (key: string) => {
      setVisibleCount(prev => ({
          ...prev,
          [key]: (prev[key] || 10) + 10
      }));
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const SegmentStopsDialog = ({ segment }: { segment: RouteSegment }) => {
    const handleStopPropagation = (e: React.MouseEvent | React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
    };

    return (
      <div 
        onClick={handleStopPropagation}
        onPointerDown={handleStopPropagation}
        onMouseDown={handleStopPropagation}
        onPointerUp={handleStopPropagation}
        onMouseUp={handleStopPropagation}
        className="shrink-0"
      >
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1 px-2 py-1 rounded bg-secondary/50 border text-xs sm:text-sm hover:bg-secondary transition-colors">
              <Bus className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="font-medium">{segment.busNumber}</span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bus {segment.busNumber} Stops</DialogTitle>
              <CardDescription>{segment.startStop} to {segment.endStop}</CardDescription>
            </DialogHeader>
            <div className="py-4">
              <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-2">
                {segment.stops.map((stop, index) => (
                  <li key={index} className="mb-4 sm:mb-6 ml-4 sm:ml-6">
                    <span className="absolute flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full -left-2.5 sm:-left-3 ring-4 sm:ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">
                      <Bus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-800 dark:text-blue-300"/>
                    </span>
                    <h3 className="flex items-center mb-1 text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                      {stop}
                      {(stop === segment.startStop || stop === segment.endStop) && (
                        <Badge variant={stop === segment.startStop ? 'default': 'destructive'} className="ml-2 sm:ml-3 text-xs">{stop === segment.startStop ? 'Board' : 'Alight'}</Badge>
                      )}
                    </h3>
                  </li>
                ))}
              </ol>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // Group routes by transfer count
  const groupedByTransfers = useMemo(() => {
      if (!suggestion?.routes) return {};
      const groups: Record<number, SuggestedRoute[]> = {};
      suggestion.routes.forEach(route => {
          const transfers = route.segments.length - 1;
          if (!groups[transfers]) groups[transfers] = [];
          groups[transfers].push(route);
      });
      return groups;
  }, [suggestion]);

  // Further group by first bus within each transfer group
  const groupedByFirstBus = useMemo(() => {
      const result: Record<number, Record<string, SuggestedRoute[]>> = {};
      
      Object.entries(groupedByTransfers).forEach(([transferKey, routes]) => {
          const transfers = parseInt(transferKey);
          result[transfers] = {};
          
          routes.forEach(route => {
              const firstBus = route.segments[0].busNumber;
              const firstSegmentKey = `${firstBus}|${route.segments[0].startStop}|${route.segments[0].endStop}`;
              if (!result[transfers][firstSegmentKey]) {
                  result[transfers][firstSegmentKey] = [];
              }
              result[transfers][firstSegmentKey].push(route);
          });
      });
      
      return result;
  }, [groupedByTransfers]);

  const sortedTransferKeys = useMemo(() => {
      return Object.keys(groupedByTransfers).map(Number).sort((a,b) => a - b);
  }, [groupedByTransfers]);

  // Render a single route option within accordion
  const renderRouteOption = (route: SuggestedRoute, idx: number) => {
    const hasTransfers = route.segments.length > 1;
    
    return (
      <div key={idx} className={`flex items-center justify-between py-2 px-2 ${idx > 0 ? 'border-t' : ''}`}>
        <div className="flex items-center gap-1 flex-wrap text-xs sm:text-sm">
          {hasTransfers ? (
            <>
              {route.segments.slice(1).map((segment, segIdx) => (
                <div key={segIdx} className="flex items-center gap-1">
                  {segIdx > 0 && <ChevronsRight className="h-3 w-3 text-muted-foreground" />}
                  <SegmentStopsDialog segment={segment} />
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium text-xs sm:text-sm">{segment.endStop}</span>
                </div>
              ))}
            </>
          ) : (
            <>
              <span className="text-muted-foreground">Direct to</span>
              <span className="font-medium">{route.segments[0].endStop}</span>
              <span className="text-muted-foreground text-[10px] sm:text-xs">({route.segments[0].stops.length} stops)</span>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); handleSaveRoute(route); }}
          className="h-6 w-6 sm:h-7 sm:w-7 shrink-0"
          title={isSuggestedRouteSaved(route) ? 'Already saved' : 'Save route'}
        >
          <Star className={`h-3 w-3 sm:h-4 sm:w-4 ${isSuggestedRouteSaved(route) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
        </Button>
      </div>
    );
  };

  // Render an accordion card for routes starting with the same bus
  const renderAccordionCard = (firstSegmentKey: string, routes: SuggestedRoute[], transferKey: number) => {
    const firstRoute = routes[0];
    const firstSegment = firstRoute.segments[0];
    const accordionKey = `${transferKey}-${firstSegmentKey}`;
    const isOpen = openAccordions.has(accordionKey);
    const routeCount = routes.length;
    const hasTransfers = transferKey > 0;
    const transferPoint = firstSegment.endStop;
    
    return (
      <Collapsible key={firstSegmentKey} open={isOpen}>
        {/* Entire card is clickable to toggle accordion */}
        <div 
          className="p-3 sm:p-4 border rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer"
          onClick={() => toggleAccordion(accordionKey)}
        >
          {/* Line 1: Bus number + route + chevron */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Bus number button - clicking this should NOT toggle accordion */}
              <SegmentStopsDialog segment={firstSegment} />
              <span className="text-xs sm:text-sm text-muted-foreground">
                {firstSegment.startStop} → {firstSegment.endStop}
              </span>
            </div>
            <div className="shrink-0">
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
          {/* Line 2: Routes count */}
          <div className="mt-1.5">
            <Badge variant="secondary" className="text-[10px] sm:text-xs">
              {routeCount} {routeCount === 1 ? 'route' : 'routes'}
            </Badge>
          </div>
        </div>
        <CollapsibleContent>
          <div className="mt-1 ml-4 sm:ml-6 border-l-2 border-primary/30 bg-secondary/20 rounded-b-lg">
            {hasTransfers && (
              <div className="px-2 pt-2 pb-1 text-[10px] sm:text-xs text-muted-foreground">
                Transfer from {transferPoint} to:
              </div>
            )}
            {routes.map((route, idx) => renderRouteOption(route, idx))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="sourceStop"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm">Source Bus Stop</FormLabel>
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
                  <FormLabel className="text-xs sm:text-sm">Destination Bus Stop</FormLabel>
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
        <Card className="mt-4 sm:mt-6 animate-in fade-in">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Suggested Routes</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
                {suggestion.isRoutePossible 
                    ? `Found ${suggestion.routes.length} possible route(s).`
                    : "No direct or single-transfer route could be found."
                }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {suggestion.isRoutePossible && suggestion.routes.length > 0 ? (
                <Tabs defaultValue={sortedTransferKeys[0]?.toString()} className="w-full">
                    <TabsList className="flex flex-wrap h-auto gap-1">
                        {sortedTransferKeys.map(transfers => (
                            <TabsTrigger key={transfers} value={transfers.toString()} className="text-xs sm:text-sm px-2 sm:px-3">
                                {transfers === 0 ? 'Direct' : `${transfers} Transfer${transfers > 1 ? 's' : ''}`}
                                <Badge variant="secondary" className="ml-1 sm:ml-2 text-[10px] sm:text-xs">{groupedByTransfers[transfers].length}</Badge>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    
                    {sortedTransferKeys.map(transfers => {
                        const busGroups = groupedByFirstBus[transfers] || {};
                        const groupKeys = Object.keys(busGroups);
                        const visible = visibleCount[transfers.toString()] || 10;
                        const shownGroups = groupKeys.slice(0, visible);
                        const hasMore = visible < groupKeys.length;

                        return (
                            <TabsContent key={transfers} value={transfers.toString()} className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
                                {shownGroups.map(groupKey => renderAccordionCard(groupKey, busGroups[groupKey], transfers))}
                                
                                {hasMore && (
                                    <div className="flex justify-center pt-2 sm:pt-4">
                                        <Button variant="outline" size="sm" onClick={() => loadMore(transfers.toString())}>
                                            <ChevronDown className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                            <span className="text-xs sm:text-sm">Show More</span>
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
            <div className="pt-3 sm:pt-4 border-t mt-2 space-y-2">
              <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
                <Info className="h-3 w-3 shrink-0" />
                Tap cards to expand. Tap bus badges to view stops.
              </p>
              <p className="text-[10px] sm:text-xs text-amber-500/90">
                ⚠️ This is community data. No bus timings available, routes may vary. Please verify at the bus stop and/or with the locals.
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Found an error? <a href="/settings" className="text-primary hover:underline">Report in Settings</a>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
