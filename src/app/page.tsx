import { SmartRouteFinder } from '@/components/smart-route-finder';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getBusRoutes } from '@/lib/bus-data';
import { Bus, MapPin } from 'lucide-react';

export default async function Home() {
  const busRoutes = await getBusRoutes();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Responsive padding: smaller on mobile */}
      <div className="container mx-auto max-w-4xl px-3 sm:px-4 py-8 sm:py-12 md:py-16">
        {/* Hero Content */}
        <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 text-center mb-6 sm:mb-8">
          {/* Main Heading - responsive text sizes */}
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Find Your Way in{' '}
              <span className="text-primary">Mangalore</span>
            </h1>
            <p className="mx-auto max-w-[600px] text-muted-foreground text-base sm:text-lg md:text-xl leading-relaxed px-2">
              Enter your start and end points to get the best bus route suggestions.
            </p>
          </div>

          {/* Quick Stats - responsive spacing and text */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 pt-1 sm:pt-2">
            <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
              <Bus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-xs sm:text-sm font-medium">{busRoutes.length}+ Bus Routes</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-xs sm:text-sm font-medium">100+ Stops Covered</span>
            </div>
          </div>
        </div>

        {/* Search Card - responsive shadow */}
        <Card className="shadow-md sm:shadow-lg">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-lg sm:text-xl">
              <Bus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Mangalore Bus Routes Finder
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Get intelligent route suggestions, including transfers.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <SmartRouteFinder busRoutes={busRoutes} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
