import type { EventResponseDTO, EventType } from '../types/events.types';

const BASE_URL = 'http://localhost:8080/api/rest';

export async function getEvents(eventType: EventType | '' = ''): Promise<EventResponseDTO[]> {
    const url = eventType
        ? `${BASE_URL}/events?type=${eventType}`
        : `${BASE_URL}/events`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Error al obtener la lista de eventos`);
    }

    const data: EventResponseDTO[] = await response.json();
    return data;
}