import { SmartRouteFinder } from '@/components/smart-route-finder';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getBusRoutes } from '@/lib/bus-data';

export default async function Home() {
  const busRoutes = await getBusRoutes();
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="flex flex-col items-center justify-center space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
            Find Your Way in Mangalore
          </h1>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            Enter your start and end points to get the best bus route suggestions, powered by our smart algorithm.
          </p>
        </div>
        <Card className="w-full shadow-lg text-left">
          <CardHeader>
            <CardTitle>Mangalore Bus Routes Finder</CardTitle>
            <CardDescription>Get intelligent route suggestions, including transfers.</CardDescription>
          </CardHeader>
          <CardContent>
            <SmartRouteFinder busRoutes={busRoutes} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
