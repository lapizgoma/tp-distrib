import { useState, useEffect } from 'react';
import type { EventResponseDTO, EventType } from '../types/events.types';
import { getEvents } from '../api/eventsApi';

interface UseEventsReturn {
    events: EventResponseDTO[];
    loading: boolean;
    error: string | null;    
}

export function useEvents(selectedType: EventType | '' = ''): UseEventsReturn {
    const [events, setEvents] = useState<EventResponseDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        getEvents(selectedType)
            .then((data) => setEvents(data))
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, [selectedType]);

    return { events, loading, error };
}