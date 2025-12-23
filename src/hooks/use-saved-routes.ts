'use client';
import { useState, useEffect, useCallback } from 'react';

const SAVED_ROUTES_KEY = 'mangalore-bus-routes-saved';

export function useSavedRoutes() {
    const [savedRouteIds, setSavedRouteIds] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const item = window.localStorage.getItem(SAVED_ROUTES_KEY);
            if (item) {
                setSavedRouteIds(JSON.parse(item));
            }
        } catch (error) {
            console.error('Error reading from localStorage', error);
        }
        setIsLoaded(true);
    }, []);

    const updateLocalStorage = (ids: string[]) => {
        try {
            window.localStorage.setItem(SAVED_ROUTES_KEY, JSON.stringify(ids));
        } catch (error) {
            console.error('Error writing to localStorage', error);
        }
    };

    const toggleSaveRoute = useCallback((routeId: string) => {
        setSavedRouteIds((prev) => {
            const isSaved = prev.includes(routeId);
            const newIds = isSaved
                ? prev.filter(id => id !== routeId)
                : [...prev, routeId];
            updateLocalStorage(newIds);
            return newIds;
        });
    }, []);

    const isRouteSaved = useCallback((routeId: string) => {
        return savedRouteIds.includes(routeId);
    }, [savedRouteIds]);

    return { savedRouteIds, toggleSaveRoute, isRouteSaved, isLoaded };
}
