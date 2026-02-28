
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { smartRouteSuggestion, type SmartRouteSuggestionOutput } from '@/lib/smart-route-suggestion';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, ChevronsRight, Bus, Star, ChevronDown, ChevronUp, Info, MapPin } from 'lucide-react';
import { buildMapsUrl } from '@/lib/utils';
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
                      <a
                        href={buildMapsUrl(stop)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="ml-2 inline-flex items-center justify-center h-6 w-6 rounded-full text-primary hover:bg-primary/10 transition-colors"
                        title={`Open ${stop} in Google Maps`}
                      >
                        <MapPin className="h-3.5 w-3.5" />
                      </a>
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

  // Group by "Tail Signature" - buses that have the exact same connecting options
  const groupedByCommonTails = useMemo(() => {
    const result: Record<number, Array<{
      headerSegments: RouteSegment[];
      routes: SuggestedRoute[];
      id: string; // Helper for keys
    }>> = {};

    Object.entries(groupedByTransfers).forEach(([transferKey, routes]) => {
      const transfers = parseInt(transferKey);
      result[transfers] = [];

      // 1. First, group by the specific First Bus (e.g. "4A|Start|End")
      // This gives us the full set of routes for each source bus.
      const byFirstBus: Record<string, { segment: RouteSegment, routes: SuggestedRoute[] }> = {};
      
      routes.forEach(route => {
        const firstSeg = route.segments[0];
        // Key uniquely identifies the "Source Bus" trip
        const key = `${firstSeg.busNumber}|${firstSeg.startStop}|${firstSeg.endStop}`;
        
        if (!byFirstBus[key]) {
          byFirstBus[key] = { segment: firstSeg, routes: [] };
        }
        byFirstBus[key].routes.push(route);
      });

      // 2. Now group these "Source Bus Groups" by their tails.
      // If two source buses have the same list of connecting routes (tails), they get merged.
      
      // Map: TailSignature -> { headers: Segment[], representativeRoutes: SuggestedRoute[] }
      const byTailSig: Record<string, { headers: RouteSegment[], representativeRoutes: SuggestedRoute[] }> = {};

      Object.values(byFirstBus).forEach(({ segment, routes: routeList }) => {
        // Create a signature for the tails.
        // For direct routes (transfers=0), the signature is just "DIRECT".
        // For transfers, it's the sorted list of tail segment identifiers.
        let signature = "DIRECT";
        
        if (transfers > 0) {
           // Get all unique tails for this source bus
           // A "tail" is the chain of segments after the first one.
           // Since we are inside a specific transfer count, and specific source bus context...
           // Actually, `routeList` contains all the variations from this Source Bus.
           // We need to capture the *set* of tails this source bus offers.
           
           const tailStrings = routeList.map(r => {
             // Create a string for segments 1..N
             return r.segments.slice(1).map(s => `${s.busNumber}-${s.startStop}-${s.endStop}`).join('>>');
           });
           tailStrings.sort();
           signature = tailStrings.join('||');
        } else {
             // For direct routes, we might still want to group if they are truly identical (e.g. 4A and 4B both go direct)
             // But usually direct routes are distinct entries. 
             // However, strictly adhering to "group by identical children" (children=empty set),
             // implies all direct routes from A to B could be grouped?
             // The issue description implies "source buses which have identical connecting buses".
             // For direct routes, connecting buses = []. So they are all identical.
             // So yes, we should group direct buses too if they go to the same place.
             signature = "DIRECT";
        }

        if (!byTailSig[signature]) {
          byTailSig[signature] = { headers: [], representativeRoutes: routeList };
        }
        byTailSig[signature].headers.push(segment);
      });

      // 3. Convert back to array
      result[transfers] = Object.entries(byTailSig).map(([sig, data]) => ({
        headerSegments: data.headers,
        routes: data.representativeRoutes, // The routes from the first bus added are sufficient as representatives for the tails
        id: sig
      }));
       
      // Sort specific groups? Maybe by bus number of first header?
      result[transfers].sort((a, b) => 
        a.headerSegments[0].busNumber.localeCompare(b.headerSegments[0].busNumber, undefined, { numeric: true })
      );
    });

    return result;
  }, [groupedByTransfers]);

  const sortedTransferKeys = useMemo(() => {
      return Object.keys(groupedByTransfers).map(Number).sort((a,b) => a - b);
  }, [groupedByTransfers]);

  // Render a single route option within accordion
  const renderRouteOption = (route: SuggestedRoute, idx: number) => {
    const hasTransfers = route.segments.length > 1;
    // If grouped, we effectively show the tails. The header bus was handled in the card header.
    
    return (
      <div key={idx} className={`flex items-start justify-between py-2 px-2 ${idx > 0 ? 'border-t' : ''}`}>
        <div className="flex flex-col gap-1.5 text-xs sm:text-sm w-full max-w-[85%]">
          {hasTransfers ? (
            <>
              {route.segments.slice(1).map((segment, segIdx) => (
                <div key={segIdx} className="flex items-center gap-1.5 flex-wrap">
                  <SegmentStopsDialog segment={segment} />
                  <span className="text-muted-foreground text-xs">→ Drop at {segment.endStop}</span>
                </div>
              ))}
            </>
          ) : (
            // Direct Route:
            // Since we might group direct routes, we don't need to re-list the bus name here
            // unless we want to distinguish *which* of the grouped buses corresponds to... wait.
            // If they are grouped, they are equivalent. 
            // For Direct routes grouped together, the "route option" is just "Direct Trip".
            // It feels redundant to list anything here for Direct routes if grouped.
            // But `renderRouteOption` is called inside the collapsible content.
            // For Direct routes, we typically don't use Collapsible if it's a single item.
            // But now we might have a group.
            <div className="flex items-center gap-1.5 flex-wrap text-muted-foreground italic text-xs">
              Goes directly to destination.
            </div>
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

  // Render an accordion card for a GROUP of buses having identical tails
  const renderAccordionCard = (
      group: { headerSegments: RouteSegment[], routes: SuggestedRoute[], id: string }, 
      transferKey: number
  ) => {
    const { headerSegments, routes, id: groupId } = group;
    // We utilize the first route in the list to act as the "representative" for structure info like Transfer Point.
    // Note: If we grouped different Direct Routes, 'routes' array might specific to the *first* bus of the group.
    // But logically, for Direct routes, the "tail" is empty, so they are all equivalent.
    
    const representativeRoute = routes[0];
    const representativeSegment = representativeRoute.segments[0];
    
    // Sort header segments naturally
    const sortedHeaders = [...headerSegments].sort((a,b) => 
        a.busNumber.localeCompare(b.busNumber, undefined, { numeric: true })
    );

    // Creates a unique ID for the accordion state
    // Use the group ID (tail signature) to ensure uniqueness even if headers are same (which means different tails)
    const accordionKey = `${transferKey}-${groupId}`;
    const isOpen = openAccordions.has(accordionKey);
    const routeCount = routes.length; // This is the number of connecting options (tails)
    const hasTransfers = transferKey > 0;
    const transferPoint = representativeSegment.endStop;
    
    // Header Content: List of Bus Badges
    const HeaderBusList = () => (
        <div className="flex flex-wrap gap-1 items-center">
             {sortedHeaders.map((seg, i) => (
                 <div key={i} className="flex items-center">
                     <SegmentStopsDialog segment={seg} />
                     {i < sortedHeaders.length - 1 && <span className="text-muted-foreground text-xs mx-0.5">,</span>}
                 </div>
             ))}
             <span className="text-sm font-medium ml-1">
                 {/* Only show trip details if it fits, or maybe just "Start -> Transfer" */}
                 {hasTransfers ? (
                     <span className="text-muted-foreground text-xs">({representativeSegment.startStop} → {representativeSegment.endStop})</span>
                 ) : (
                     <span className="text-muted-foreground text-xs">({representativeSegment.startStop} → {representativeSegment.endStop})</span>
                 )}
             </span>
        </div>
    );

    // Direct Routes Logic
    if (!hasTransfers) {
        // If multiple direct buses are grouped (e.g. 4A, 4B both go direct)
        // We show one card listing all of them.
        return (
            <Card key={accordionKey} className="overflow-hidden">
                <CardHeader className="p-3 sm:p-4 flex flex-row items-start justify-between space-y-0">
                    <div className="flex flex-col gap-2 text-left w-full">
                        <HeaderBusList />
                        
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                             <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                {representativeSegment.stops.length} stops
                            </Badge>
                             <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">Direct Route</span>
                        </div>
                    </div>

                    <div className="shrink-0">
                         {/* 
                           Saving mechanism: 
                           Since we merged multiple buses, which one do we save? 
                           Ideally we save the *Concept* "Take any of 4A, 4B...".
                           But our data model saves specific routes.
                           For now, let's just save the representative (first) one, 
                           OR provide a dropdown to save specific ones?
                           Simpler: Just save the representative one. 
                           The user will see "4A" in saved routes, which is fine.
                         */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleSaveRoute(representativeRoute); }}
                          className="h-8 w-8 -mt-1 -mr-1"
                          title={isSuggestedRouteSaved(representativeRoute) ? 'Already saved' : 'Save route'}
                        >
                          <Star className={`h-4 w-4 ${isSuggestedRouteSaved(representativeRoute) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
            </Card>
        );
    }

    // Transfer Routes: Keep Dropdown
    return (
      <Collapsible key={accordionKey} open={isOpen}>
        {/* Entire card is clickable to toggle accordion */}
        <div 
          className="p-3 sm:p-4 border rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer"
          onClick={() => toggleAccordion(accordionKey)}
        >
          {/* Line 1: List of Source Buses + chevron */}
          <div className="flex items-start justify-between gap-2">
            <div className="w-full">
                <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Take any of:</div>
                <HeaderBusList />
            </div>
            
            <div className="shrink-0 mt-1">
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
          {/* Line 2: Routes count */}
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] sm:text-xs">
              {routeCount} connection option{routeCount === 1 ? '' : 's'}
            </Badge>
          </div>
        </div>
        <CollapsibleContent>
          <div className="mt-1 ml-4 sm:ml-6 border-l-2 border-primary/30 bg-secondary/20 rounded-b-lg">
            {hasTransfers && (
              <div className="px-2 pt-2 pb-1 text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                 <span className="font-semibold text-primary">Then at {transferPoint}, take:</span>
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
                  <div className="flex items-center gap-1.5">
                    <FormControl>
                      <AutoComplete 
                          options={allStops}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select a source stop..."
                      />
                    </FormControl>
                    <a
                      href={field.value ? buildMapsUrl(field.value) : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-md border transition-colors ${
                        field.value
                          ? 'text-primary border-primary/30 hover:bg-primary/10 cursor-pointer'
                          : 'text-muted-foreground/40 border-muted cursor-not-allowed pointer-events-none'
                      }`}
                      title={field.value ? `Open ${field.value} in Google Maps` : 'Select a stop first'}
                      aria-disabled={!field.value}
                    >
                      <MapPin className="h-4 w-4" />
                    </a>
                  </div>
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
                  <div className="flex items-center gap-1.5">
                    <FormControl>
                      <AutoComplete 
                          options={allStops}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select a destination stop..."
                      />
                    </FormControl>
                    <a
                      href={field.value ? buildMapsUrl(field.value) : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-md border transition-colors ${
                        field.value
                          ? 'text-primary border-primary/30 hover:bg-primary/10 cursor-pointer'
                          : 'text-muted-foreground/40 border-muted cursor-not-allowed pointer-events-none'
                      }`}
                      title={field.value ? `Open ${field.value} in Google Maps` : 'Select a stop first'}
                      aria-disabled={!field.value}
                    >
                      <MapPin className="h-4 w-4" />
                    </a>
                  </div>
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
                        const groups = groupedByCommonTails[transfers] || [];
                        const visible = visibleCount[transfers.toString()] || 10;
                        const shownGroups = groups.slice(0, visible);
                        const hasMore = visible < groups.length;

                        return (
                            <TabsContent key={transfers} value={transfers.toString()} className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
                                {shownGroups.map(group => renderAccordionCard(group, transfers))}
                                
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
