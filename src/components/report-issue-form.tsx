'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const reportSchema = z.object({
  issueType: z.string({ required_error: 'Please select an issue type.' }),
  busNumber: z.string().optional(),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }).max(500),
});

export function ReportIssueForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
        busNumber: '',
        description: '',
    },
  });

  function onSubmit(values: z.infer<typeof reportSchema>) {
    console.log('Issue Reported:', values);
    toast({
      title: 'Report Submitted!',
      description: 'Thank you for your feedback. We will look into it.',
    });
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="issueType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type of Issue</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an issue category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="delay">Bus Delay</SelectItem>
                  <SelectItem value="overcrowding">Overcrowding</SelectItem>
                  <SelectItem value="incorrect-info">Incorrect Route Information</SelectItem>
                  <SelectItem value="bus-condition">Bus Condition</SelectItem>
                  <SelectItem value="driver-behavior">Driver/Conductor Behavior</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="busNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bus Number (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 45G" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please describe the issue in detail."
                  className="resize-none"
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Submit Report
        </Button>
      </form>
    </Form>
  );
}
