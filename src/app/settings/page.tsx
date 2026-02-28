import { getBusRoutes } from '@/lib/bus-data';
import { SettingsClient } from '@/components/settings-client';

export default async function SettingsPage() {
  const routes = await getBusRoutes();
  
  // Build unique stop names for autocomplete
  const uniqueStops = new Set<string>();
  routes.forEach(r => r.stops.forEach(s => uniqueStops.add(s)));
  const allStops = Array.from(uniqueStops)
    .sort()
    .map(s => ({ value: s, label: s }));

  return <SettingsClient allRoutes={routes} allStops={allStops} />;
}
