import { ReportIssueForm } from '@/components/report-issue-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ReportPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="space-y-2 mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">
          Report an Issue
        </h1>
        <p className="text-muted-foreground md:text-lg">
          Help us improve the service by reporting any issues you encounter.
        </p>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Issue Report Form</CardTitle>
          <CardDescription>Your feedback is valuable to us.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportIssueForm />
        </CardContent>
      </Card>
    </div>
  );
}
