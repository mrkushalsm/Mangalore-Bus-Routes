
'use client';
import { useState } from 'react';
import type { SmartRouteSuggestionOutput } from '@/ai/flows/smart-route-suggestion';
import { useSavedJourneys } from '@/hooks/use-saved-journeys';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { ChevronsRight, Bus, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type RouteSegment = NonNullable<SmartRouteSuggestionOutput['routes']>[0]['segments'][0];
type SuggestedRoute = NonNullable<SmartRouteSuggestionOutput['routes']>[0];

type SuggestedRouteCardProps = {
    route: SuggestedRoute & { id?: string };
    isLast: boolean;
    isSavedView?: boolean;
    sourceStop?: string;
    destinationStop?: string;
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
          <DialogDescription>{segment.startStop} to {segment.endStop}</DialogDescription>
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

export function SuggestedRouteCard({ route, isLast, isSavedView = false, sourceStop, destinationStop }: SuggestedRouteCardProps) {
    const { addJourney, removeJourney, isJourneySaved } = useSavedJourneys();
    const { toast } = useToast();
    
    // Generate a stable ID for the route based on its segments
    const journeyId = route.id || route.segments.map(s => `${s.busNumber}-${s.startStop}-${s.endStop}`).join('|');
    const isSaved = isJourneySaved(journeyId);
    
    const handleSave = () => {
        if (!sourceStop || !destinationStop) {
            toast({
                title: "Cannot Save Journey",
                description: "Source and destination are missing.",
                variant: 'destructive',
            });
            return;
        }

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
    };

    const handleRemove = () => {
        removeJourney(journeyId);
        toast({
            title: "Journey Removed",
            description: "The journey has been removed from your saved list."
        });
    };

    return (
        <div className={isSavedView ? '' : 'p-4 border rounded-lg relative'}>
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
            
            {isSavedView ? (
                <Button
                    variant='outline'
                    size="sm"
                    onClick={handleRemove}
                    className="absolute top-3 right-3"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                </Button>
            ) : (
                <Button
                    variant={isSaved ? 'default' : 'outline'}
                    size="sm"
                    onClick={isSaved ? handleRemove : handleSave}
                    className="absolute top-3 right-3"
                >
                    <Star className={`mr-2 h-4 w-4 ${isSaved ? 'fill-current text-yellow-400' : ''}`} />
                    {isSaved ? 'Saved' : 'Save'}
                </Button>
            )}

            {!isLast && !isSavedView && <Separator className="mt-6" />}
        </div>
    );
}
