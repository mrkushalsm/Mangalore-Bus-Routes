import { BusRoutesList } from '@/components/bus-routes-list';
import { getBusRoutes } from '@/lib/bus-data';
import { Bus, Search } from 'lucide-react';

export default async function RoutesPage() {
  const busRoutes = await getBusRoutes();
  
  return (
    <div className="min-h-full">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-transparent" />
        
        <div className="relative container mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Available Bus Routes
              </h1>
              <p className="text-muted-foreground max-w-lg">
                Search and explore all {busRoutes.length} bus routes operating in Mangalore. 
                Save your favorites for quick access.
              </p>
            </div>
            
            {/* Stats badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 border border-border/50">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{busRoutes.length} routes available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Routes List */}
      <div className="container mx-auto max-w-6xl px-4 pb-8">
        <BusRoutesList allRoutes={busRoutes} />
      </div>
    </div>
  );
}
