
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
                    className="gap-1"
                >
                    <Loader2 className="h-4 w-4 animate-spin" />
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
                    className="gap-1 text-primary"
                >
                    <Check className="h-4 w-4" />
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
                className="h-8 w-8"
                title={isSaved ? 'Remove from saved' : 'Save journey'}
            >
                <Star className={`h-5 w-5 ${isSaved ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </Button>
        );
    };

    return (
        <div className={isSavedView ? '' : 'p-4 border rounded-lg'}>
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
            
            {/* Save/Remove button - positioned at bottom right */}
            <div className="flex justify-end mt-3">
                {isSavedView ? (
                    <Button
                        variant='ghost'
                        size="sm"
                        onClick={handleRemove}
                        className="text-destructive hover:text-destructive gap-1"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="text-xs">Remove</span>
                    </Button>
                ) : (
                    renderSaveButton()
                )}
            </div>

            {!isLast && !isSavedView && <Separator className="mt-4" />}
        </div>
    );
}
