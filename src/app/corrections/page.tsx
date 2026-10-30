import { getBusRoutes } from '@/lib/bus-data';
import { MyCorrectionsClient } from '@/components/my-corrections-client';

export const metadata = {
  title: 'My Route Corrections | Mangalore Bus Routes',
  description: 'Track your submitted bus route corrections, view reviewer feedback, and revise active pull requests.',
};

export default async function CorrectionsPage() {
  const routes = await getBusRoutes();

  // Build unique stop names for autocomplete
  const uniqueStops = new Set<string>();
  routes.forEach(r => r.stops.forEach(s => uniqueStops.add(s)));
  const allStops = Array.from(uniqueStops)
    .sort()
    .map(s => ({ value: s, label: s }));

  return <MyCorrectionsClient allRoutes={routes} allStops={allStops} />;
}

