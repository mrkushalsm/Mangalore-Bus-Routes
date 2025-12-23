import { BusRoute } from './bus-data';

// Types for the algorithm output
export type RouteSegment = {
    busNumber: string;
    startStop: string;
    endStop: string;
    stops: string[];
};

export type FoundRoute = {
    summary: string;
    segments: RouteSegment[];
};

export type RouteFinderOutput = {
    isRoutePossible: boolean;
    routes: FoundRoute[];
    reasoning: string;
};

// Types for internal graph traversal
type StopNode = {
    stopName: string;
};

// A "Hop" represents a single bus ride from one stop to another
type BusHop = {
    bus: BusRoute;
    startStop: string;
    endStop: string;
    hopStops: string[]; // The actual stops passed through
};

// Queue item for BFS
type PathState = {
    currentStop: string;
    history: BusHop[];
    visitedBuses: Set<string>; // Bus IDs we've already used in this path
};

/**
 * Builds an index of StopName -> List of Buses that stop there.
 */
function buildStopIndex(allRoutes: BusRoute[]): Map<string, BusRoute[]> {
    const index = new Map<string, BusRoute[]>();

    for (const route of allRoutes) {
        for (const stop of route.stops) {
            if (!index.has(stop)) {
                index.set(stop, []);
            }
            index.get(stop)?.push(route);
        }
    }

    return index;
}

/**
 * Extracts the slice of stops between start and end for a given bus.
 * Handles bi-directionality (Forward or Reverse).
 */
function getSegmentStops(route: BusRoute, start: string, end: string): string[] | null {
    const startIndex = route.stops.indexOf(start);
    const endIndex = route.stops.indexOf(end);

    if (startIndex === -1 || endIndex === -1) return null;

    if (startIndex < endIndex) {
        // Forward direction
        return route.stops.slice(startIndex, endIndex + 1);
    } else {
        // Reverse direction
        return route.stops.slice(endIndex, startIndex + 1).reverse();
    }
}

/**
 * Main algorithm: Reachability BFS.
 * Finds all routes from source to dest with up to maxTransfers.
 */
export function findRoutes(
    source: string,
    dest: string,
    allRoutes: BusRoute[],
    maxTransfers: number = 2
): RouteFinderOutput {
    // Edge case: Same start/end
    if (source.toLowerCase() === dest.toLowerCase()) {
        return {
            isRoutePossible: false,
            routes: [],
            reasoning: "Source and destination are the same."
        };
    }

    const stopIndex = buildStopIndex(allRoutes);

    // BFS Queue
    const queue: PathState[] = [
        { currentStop: source, history: [], visitedBuses: new Set() }
    ];

    const validRoutes: FoundRoute[] = [];

    // To avoid infinite loops and excessive redundancy
    // We track visited stops at a specific "transfer depth"
    // If we reach Stop X with 1 transfer, we don't need to process reaching Stop X with 2 transfers again (usually)
    // Simple visited set: StopName -> MinTransfersSeen
    const visitedStops = new Map<string, number>();
    visitedStops.set(source, 0);

    // We limit the total number of solutions to preventing flooding the UI
    const MAX_SOLUTIONS = 50;
    let iterations = 0;
    const MAX_ITERATIONS = 5000; // Circuit breaker

    while (queue.length > 0) {
        iterations++;
        if (iterations > MAX_ITERATIONS) break;
        if (validRoutes.length >= MAX_SOLUTIONS) break;

        const state = queue.shift()!;
        const { currentStop, history, visitedBuses } = state;
        const currentTransfers = history.length; // 0 items = 0 transfers (start), 1 item = 0 transfers (completed 1 leg)... wait.
        // Actually: 
        // 0 segments = at start.
        // 1 segment = reached somewhere (0 transfers if dest).
        // so `history.length` is strictly the number of bus rides.
        // Transfers = history.length - 1.

        // If we've already done enough transfers, we can't add another leg unless it reaches destination
        if (history.length > maxTransfers + 1) continue;

        // Get all buses valid at this stop
        const availableBuses = stopIndex.get(currentStop) || [];

        for (const bus of availableBuses) {
            if (visitedBuses.has(bus.id)) continue; // Don't take the same bus twice

            // Optimization: Is the destination explicitly on this bus?
            // If so, we found a route!
            if (bus.stops.includes(dest)) {
                const segmentStops = getSegmentStops(bus, currentStop, dest);
                if (segmentStops) {
                    const newHop: BusHop = {
                        bus: bus,
                        startStop: currentStop,
                        endStop: dest,
                        hopStops: segmentStops
                    };

                    // Construct result
                    const fullHistory = [...history, newHop];
                    const transferCount = fullHistory.length - 1;

                    validRoutes.push({
                        summary: transferCount === 0 ? "Direct" : `${transferCount} Transfer${transferCount > 1 ? 's' : ''}`,
                        segments: fullHistory.map(hop => ({
                            busNumber: hop.bus.busNumber,
                            startStop: hop.startStop,
                            endStop: hop.endStop,
                            stops: hop.hopStops
                        }))
                    });

                    // We don't stop searching, because we might find other routes (e.g. via different hubs)
                    // But we don't continue bfs from here for this path since we reached dest.
                }
                continue;
            }

            // If dest is NOT on this bus, we need to transfer.
            // If we are already at max bus rides (max transfers + 1), we can't transfer again.
            if (history.length >= maxTransfers + 1) continue;

            // "Reachability" Step:
            // Where can we go on this bus?
            // We can go to ANY stop on this bus that is "valid".
            // Since it's bidirectional, technically we can go to ANY other stop on this bus line.
            for (const nextStop of bus.stops) {
                if (nextStop === currentStop) continue;

                // Pruning: Have we visited nextStop with fewer or equal bus rides?
                // If we reached "Mallikatte" in 1 bus, we don't want to process reaching "Mallikatte" in 2 buses later.
                // Note: history.length + 1 is the depth of the *next* state
                const nextDepth = history.length + 1;
                if (visitedStops.has(nextStop) && visitedStops.get(nextStop)! <= nextDepth) {
                    // Exception: Sometimes a longer path allows a better connection later? 
                    // For simplicity and speed, we prune strictly.
                    continue;
                }

                // Record visit
                visitedStops.set(nextStop, nextDepth);

                const segmentStops = getSegmentStops(bus, currentStop, nextStop);
                if (segmentStops) {
                    const newHop: BusHop = {
                        bus: bus,
                        startStop: currentStop,
                        endStop: nextStop,
                        hopStops: segmentStops
                    };

                    queue.push({
                        currentStop: nextStop,
                        history: [...history, newHop],
                        visitedBuses: new Set([...visitedBuses, bus.id])
                    });
                }
            }
        }
    }

    // Post-processing: Deduplication and Scoring
    // 1. Sort by number of transfers (Primary)
    // 2. Sort by total number of stops (Secondary)
    validRoutes.sort((a, b) => {
        const transfersA = a.segments.length;
        const transfersB = b.segments.length;
        if (transfersA !== transfersB) return transfersA - transfersB;

        const stopsA = a.segments.reduce((acc, s) => acc + s.stops.length, 0);
        const stopsB = b.segments.reduce((acc, s) => acc + s.stops.length, 0);
        return stopsA - stopsB;
    });

    // Deduplicate: If multiple routes have exact same bus numbers in sequence, keep the one with fewer stops?
    // Actually, sometimes different bus IDs have same number (15, 15A etc). 
    // Let's filter out exact duplicates of (BusNumbers + Start/End stops).
    const uniqueRoutes: FoundRoute[] = [];
    const seenSignatures = new Set<string>();

    for (const r of validRoutes) {
        const signature = r.segments.map(s => `${s.busNumber}:${s.startStop}-${s.endStop}`).join('|');
        if (!seenSignatures.has(signature)) {
            seenSignatures.add(signature);
            uniqueRoutes.push(r);
        }
    }

    return {
        isRoutePossible: uniqueRoutes.length > 0,
        routes: uniqueRoutes,
        reasoning: uniqueRoutes.length === 0 ? "No routes found matching criteria." : ""
    };
}
