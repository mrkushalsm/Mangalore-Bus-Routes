'use client';

import { useState } from 'react';
import type { SavedJourney } from '@/hooks/use-saved-journeys';
import { MapPin, ArrowRight, Bus, ChevronsRight, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

type SavedJourneysListProps = {
  savedJourneys: SavedJourney[];
  removeJourney: (journeyId: string) => void;
};

export function SavedJourneysList({ savedJourneys, removeJourney }: SavedJourneysListProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {savedJourneys.map((journey) => {
        const transfers = journey.segments.length - 1;
        const isOpen = openItems.has(journey.id);
        
        return (
          <Collapsible key={journey.id} open={isOpen} onOpenChange={() => toggleItem(journey.id)}>
            <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
              {/* Header - Always visible */}
              <CollapsibleTrigger asChild>
                <div className="p-3 sm:p-4 cursor-pointer hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base font-semibold min-w-0">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                      <span className="truncate">{journey.sourceStop}</span>
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{journey.destinationStop}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">
                        {transfers === 0 ? 'Direct' : `${transfers} transfer${transfers > 1 ? 's' : ''}`}
                      </Badge>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  {/* Quick summary when collapsed */}
                  {!isOpen && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      {journey.segments.map((segment, index) => (
                        <span key={index} className="flex items-center gap-1">
                          {index > 0 && <ChevronsRight className="h-3 w-3" />}
                          <span className="font-medium text-foreground">{segment.busNumber}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleTrigger>
              
              {/* Expanded details */}
              <CollapsibleContent>
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 border-t border-border/50 bg-secondary/20">
                  <div className="py-3 space-y-3">
                    {journey.segments.map((segment, index) => (
                      <div key={index}>
                        {/* Transfer indicator */}
                        {index > 0 && (
                          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground ml-2">
                            <div className="w-0.5 h-4 bg-primary/30" />
                            <span>Transfer at <span className="font-medium text-foreground">{journey.segments[index-1].endStop}</span></span>
                          </div>
                        )}
                        
                        {/* Bus segment */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-card border cursor-pointer hover:bg-secondary/50 transition-colors">
                              <Bus className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                              <Badge variant="outline" className="text-sm sm:text-base font-semibold">{segment.busNumber}</Badge>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">{segment.startStop}</span>
                                <span className="mx-1">→</span>
                                <span className="font-medium text-foreground">{segment.endStop}</span>
                              </div>
                              <span className="text-[10px] sm:text-xs text-muted-foreground ml-auto">
                                {segment.stops.length} stops
                              </span>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Bus {segment.busNumber} Stops</DialogTitle>
                              <DialogDescription>{segment.startStop} to {segment.endStop}</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-2">
                                {segment.stops.map((stop, stopIndex) => (
                                  <li key={stopIndex} className="mb-4 ml-4">
                                    <span className="absolute flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full -left-2.5 ring-4 ring-white dark:ring-gray-900 dark:bg-blue-900">
                                      <Bus className="w-2.5 h-2.5 text-blue-800 dark:text-blue-300"/>
                                    </span>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {stop}
                                      {(stop === segment.startStop || stop === segment.endStop) && (
                                        <Badge variant={stop === segment.startStop ? 'default': 'destructive'} className="ml-2 text-xs">
                                          {stop === segment.startStop ? 'Board' : 'Alight'}
                                        </Badge>
                                      )}
                                    </h3>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    ))}
                  </div>
                  
                  {/* Remove button */}
                  <div className="flex justify-end pt-2 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeJourney(journey.id)}
                      className="text-destructive hover:text-destructive gap-1 h-8"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="text-xs">Remove</span>
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
