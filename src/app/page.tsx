import { SmartRouteFinder } from '@/components/smart-route-finder';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getBusRoutes } from '@/lib/bus-data';
import { Bus, MapPin } from 'lucide-react';

export default async function Home() {
  const busRoutes = await getBusRoutes();
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
        {/* Hero Content */}
        <div className="flex flex-col items-center justify-center space-y-6 text-center mb-8">
          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-foreground">
              Find Your Way in{' '}
              <span className="text-primary">Mangalore</span>
            </h1>
            <p className="mx-auto max-w-[600px] text-muted-foreground text-lg md:text-xl leading-relaxed">
              Enter your start and end points to get the best bus route suggestions.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6 pt-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bus className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{busRoutes.length}+ Bus Routes</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">100+ Stops Covered</span>
            </div>
          </div>
        </div>

        {/* Search Card */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" />
              Mangalore Bus Routes Finder
            </CardTitle>
            <CardDescription>
              Get intelligent route suggestions, including transfers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SmartRouteFinder busRoutes={busRoutes} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
