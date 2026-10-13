import type { EventResponseDTO } from '../types/events.types';

interface EventCardProps {
    event: EventResponseDTO;
}

export function EventCard({ event }: EventCardProps) {
    const formattedData = new Date(event.datetime).toLocaleString('es-AR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });

    return (
        <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: '#666', fontWeight: 'bold '}}>
                {event.eventType}
            </span>
            <h3>{event.title}</h3>
            <p>{event.description}</p>
            <p> <strong>Fecha:</strong> {formattedData}</p>
            <p> <strong>Curador a cargo:</strong> {event.leadCuratorName ?? 'Sin asignar'}</p>
            <p> <strong>Capacidad máxima:</strong> {event.maximumCapacity} personas</p>
        </div>
    )
}