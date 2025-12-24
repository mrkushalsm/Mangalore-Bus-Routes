import { SmartRouteFinder } from '@/components/smart-route-finder';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getBusRoutes } from '@/lib/bus-data';
import { Bus, MapPin, Sparkles } from 'lucide-react';

export default async function Home() {
  const busRoutes = await getBusRoutes();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
        {/* Hero Content */}
        <div className="flex flex-col items-center justify-center space-y-6 text-center mb-8">
          {/* Icon Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Smart Route Finding</span>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Find Your Way in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                Mangalore
              </span>
            </h1>
            <p className="mx-auto max-w-[600px] text-muted-foreground text-lg md:text-xl leading-relaxed">
              Enter your start and end points to get the best bus route suggestions, powered by our smart algorithm.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6 pt-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bus className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{busRoutes.length}+ Bus Routes</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium">100+ Stops Covered</span>
            </div>
          </div>
        </div>

        {/* Search Card */}
        <Card className="shadow-xl border-border/50 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-primary via-emerald-400 to-accent" />
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" />
              Mangalore Bus Routes Finder
            </CardTitle>
            <CardDescription>
              Get intelligent route suggestions, including transfers. Just enter your source and destination!
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
