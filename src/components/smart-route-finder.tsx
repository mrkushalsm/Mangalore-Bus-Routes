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
import { Loader2, Lightbulb, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  sourceStop: z.string().min(3, { message: 'Source stop must be at least 3 characters.' }),
  destinationStop: z.string().min(3, { message: 'Destination stop must be at least 3 characters.' }),
});

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
                    <Input placeholder="e.g., Surathkal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Find Route
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
            <CardTitle>Suggested Route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg font-semibold">{suggestion.route}</p>
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>AI Reasoning</AlertTitle>
              <AlertDescription>{suggestion.reasoning}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
