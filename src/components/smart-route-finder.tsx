'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { smartRouteSuggestion, type SmartRouteSuggestionOutput } from '@/ai/flows/smart-route-suggestion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, ChevronsRight, Bus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const formSchema = z.object({
  sourceStop: z.string().min(3, { message: 'Source stop must be at least 3 characters.' }),
  destinationStop: z.string().min(3, { message: 'Destination stop must be at least 3 characters.' }),
});

type RouteSegment = NonNullable<SmartRouteSuggestionOutput['routes']>[0]['segments'][0];

export function SmartRouteFinder() {
  const [suggestion, setSuggestion] = useState<SmartRouteSuggestionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceStop: '',
      destinationStop: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const result = await smartRouteSuggestion(values);
      setSuggestion(result);
    } catch (e) {
      console.error(e);
      setError('Failed to get route suggestion. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

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
                    <Input placeholder="e.g., Statebank" {...field} />
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
                    <Input placeholder="e.g., Adyar" {...field} />
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
                    ? `Found ${suggestion.routes.length} possible route(s). Click on a bus segment to see all stops.`
                    : "No direct or single-transfer route could be found."
                }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestion.isRoutePossible && suggestion.routes && suggestion.routes.length > 0 ? (
                <div className="space-y-6">
                {suggestion.routes.map((route, routeIndex) => (
                    <div key={routeIndex}>
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
                        {routeIndex < suggestion.routes.length - 1 && <Separator className="mt-6" />}
                    </div>
                ))}
                </div>
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
