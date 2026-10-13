import { useState, type ChangeEvent } from 'react';
import type { EventType } from '../types/events.types';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/EventCard';

export function EventsView() {
    const [filterType, setFilterType] = useState<EventType | ''>('');
    const { events, loading, error} = useEvents(filterType);

    const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setFilterType(e.target.value as EventType | '');
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h2> Agenta de Eventos del Museo</h2>

            <div style={{ marginBottom: '20px'}}>
                <label htmlFor="type-select" style={{ marginRight: '10px'}}>Filtrar por tipo de evento:</label>
                <select
                    id="type-select"
                    value={filterType}
                    onChange={handleSelectChange}
                >
                    <option value="">Todos los eventos</option>
                    <option value="VISITA_GUIADA">Visitas Guiadas</option>
                    <option value="TALLER">Talleres</option>
                    <option value="CHARLA">Charlas</option>
                    <option value="EXPOSICION">Exposiciones</option>
                </select>
            </div>

            {loading && <p>Cargando eventos...</p>}

            {error && <p style={{ color: 'red'}}>Error: {error}</p>}

            {!loading && !error && events.length === 0 && (
                <p>No se encontraron eventos para el filtro seleccionado.</p>
            )}

            {!loading && !error && events.map((item) => (
                <EventCard key={item.id} event={item} />
            ))}
        </div>
    )
}