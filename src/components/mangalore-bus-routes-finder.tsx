
'use client';

import { useState, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { smartRouteSuggestion, type SmartRouteSuggestionOutput } from '@/ai/flows/smart-route-suggestion';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { busRoutes } from '@/lib/bus-data';
import { AutoComplete } from '@/components/ui/autocomplete';
import { SuggestedRouteCard } from './suggested-route-card';

const formSchema = z.object({
  sourceStop: z.string().min(1, { message: 'Please select a source stop.' }),
  destinationStop: z.string().min(1, { message: 'Please select a destination stop.' }),
});

export function MangaloreBusRoutesFinder() {
  const [suggestion, setSuggestion] = useState<SmartRouteSuggestionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const allStops = useMemo(() => {
    const stops = new Set<string>();
    busRoutes.forEach(route => {
        route.stops.forEach(stop => {
            stops.add(stop);
        });
    });
    return Array.from(stops).sort().map(stop => ({ value: stop, label: stop }));
  }, []);

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

  const currentValues = form.watch();

  return (
    <div className="space-y-6">
      <FormProvider {...form}>
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
      </FormProvider>

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
                    <SuggestedRouteCard 
                        key={routeIndex} 
                        route={route} 
                        isLast={routeIndex === suggestion.routes.length - 1} 
                        sourceStop={currentValues.sourceStop}
                        destinationStop={currentValues.destinationStop}
                    />
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
