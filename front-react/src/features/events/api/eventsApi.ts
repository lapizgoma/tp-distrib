import type { EventResponseDTO, EventFilters } from '../types/events.types';

export async function getEvents(filters: EventFilters = {}): Promise<EventResponseDTO[]> {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.curatorId) params.append('curatorId', filters.curatorId.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const url = queryString ? `/api/rest/events?${queryString}` : '/api/rest/events';

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Error al obtener la lista de eventos`);
    }

    const data: EventResponseDTO[] = await response.json();
    return data;
}