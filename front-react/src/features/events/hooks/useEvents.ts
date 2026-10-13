import { useState, useEffect } from 'react';
import type { EventResponseDTO, EventFilters } from '../types/events.types';
import { getEvents } from '../api/eventsApi';

interface UseEventsReturn {
    events: EventResponseDTO[];
    loading: boolean;
    error: string | null;    
}

export function useEvents(filters: EventFilters = {}): UseEventsReturn {
    const [events, setEvents] = useState<EventResponseDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const filtersKey = JSON.stringify(filters);

    useEffect(() => {
        setLoading(true);
        setError(null);

        getEvents(filters)
            .then((data) => setEvents(data))
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, [filtersKey]);

    return { events, loading, error };
}