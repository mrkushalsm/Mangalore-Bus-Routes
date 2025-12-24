
'use client';
import { useState } from 'react';
import type { SmartRouteSuggestionOutput } from '@/lib/smart-route-suggestion';
import { useSavedJourneys } from '@/hooks/use-saved-journeys';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { ChevronsRight, Bus, Star, Trash2, Loader2, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

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
        {/* Responsive: smaller padding and text on mobile */}
        <div className="flex flex-col items-center p-2 sm:p-3 rounded-lg bg-secondary/50 border cursor-pointer hover:bg-secondary transition-colors">
          <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
            {/* Responsive icon size */}
            <Bus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            {/* Responsive badge size */}
            <Badge variant="outline" className="text-sm sm:text-base px-1.5 sm:px-2">{segment.busNumber}</Badge>
          </div>
          {/* Responsive text size */}
          <div className="text-xs sm:text-sm text-muted-foreground text-center">
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
);

type SaveState = 'idle' | 'saving' | 'saved';

export function SuggestedRouteCard({ route, isLast, isSavedView = false, sourceStop, destinationStop }: SuggestedRouteCardProps) {
    const { addJourney, removeJourney, isJourneySaved } = useSavedJourneys();
    const { toast } = useToast();
    const [saveState, setSaveState] = useState<SaveState>('idle');
    
    // Generate a stable ID for the route based on its segments
    const journeyId = route.id || route.segments.map(s => `${s.busNumber}-${s.startStop}-${s.endStop}`).join('|');
    const isSaved = isJourneySaved(journeyId);
    
    const handleSave = async () => {
        if (!sourceStop || !destinationStop) {
            toast({
                title: "Cannot Save Journey",
                description: "Source and destination are missing.",
                variant: 'destructive',
            });
            return;
        }

        setSaveState('saving');
        
        // Simulate a small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500));

        addJourney({
            ...route,
            id: journeyId,
            sourceStop,
            destinationStop,
        });
        
        setSaveState('saved');
        toast({
            title: "Journey Saved!",
            description: "You can view it on the Saved Journeys page."
        });

        // Reset to idle after showing "saved" state
        setTimeout(() => setSaveState('idle'), 1500);
    };

    const handleRemove = () => {
        removeJourney(journeyId);
        toast({
            title: "Journey Removed",
            description: "The journey has been removed from your saved list."
        });
    };

    const renderSaveButton = () => {
        if (saveState === 'saving') {
            return (
                <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    className="gap-1 h-7 sm:h-8"
                >
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    <span className="text-xs">Saving...</span>
                </Button>
            );
        }

        if (saveState === 'saved') {
            return (
                <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    className="gap-1 text-primary h-7 sm:h-8"
                >
                    <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs">Saved!</span>
                </Button>
            );
        }

        // Idle state - show only star icon (empty or filled)
        return (
            <Button
                variant="ghost"
                size="icon"
                onClick={isSaved ? handleRemove : handleSave}
                className="h-7 w-7 sm:h-8 sm:w-8"
                title={isSaved ? 'Remove from saved' : 'Save journey'}
            >
                <Star className={`h-4 w-4 sm:h-5 sm:w-5 ${isSaved ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </Button>
        );
    };

    return (
        // Responsive padding: p-3 on mobile, p-4 on desktop
        <div className={isSavedView ? '' : 'p-3 sm:p-4 border rounded-lg'}>
            {/* Responsive gaps and layout */}
            <div className="flex items-center justify-center flex-wrap gap-1 sm:gap-2 text-center">
                {route.segments.map((segment, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 justify-center">
                        {index > 0 && (
                            // Transfer indicator - stacked on mobile, inline on desktop
                            <div className="flex flex-col items-center mx-1 sm:mx-2 text-muted-foreground py-1 sm:py-0">
                                <ChevronsRight className="h-4 w-4 sm:h-6 sm:w-6" />
                                <span className="text-[10px] sm:text-xs leading-tight">Transfer at</span>
                                <span className="text-[10px] sm:text-xs font-semibold leading-tight">{route.segments[index-1].endStop}</span>
                            </div>
                        )}
                        <SegmentStopsDialog segment={segment} />
                    </div>
                ))}
            </div>
            
            {/* Save/Remove button - responsive margin */}
            <div className="flex justify-end mt-2 sm:mt-3">
                {isSavedView ? (
                    <Button
                        variant='ghost'
                        size="sm"
                        onClick={handleRemove}
                        className="text-destructive hover:text-destructive gap-1 h-7 sm:h-8"
                    >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs">Remove</span>
                    </Button>
                ) : (
                    renderSaveButton()
                )}
            </div>

            {!isLast && !isSavedView && <Separator className="mt-3 sm:mt-4" />}
        </div>
    );
}
