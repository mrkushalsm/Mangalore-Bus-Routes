import { BusRoutesList } from '@/components/bus-routes-list';
import { busRoutes } from '@/lib/bus-data';

export default function RoutesPage() {
  return (
    <div className="container mx-auto">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">
          Available Bus Routes
        </h1>
        <p className="text-muted-foreground md:text-lg">
          Search and explore all bus routes in Mangalore.
        </p>
      </div>
      <BusRoutesList allRoutes={busRoutes} />
    </div>
  );
}
