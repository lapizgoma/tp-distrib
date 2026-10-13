import { useState, type ChangeEvent } from 'react';
import type { EventType, EventFilters } from '../types/events.types';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/EventCard';

export function EventsView() {
    const [filters, setFilters] = useState<EventFilters>({
        type: '',
        curatorId: '',
        startDate: '',
        endDate: ''
    });

    const { events, loading, error} = useEvents(filters);

    const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h2> Agenda de Eventos del Museo</h2>
            
            {/* Barra de filtros */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '8px'}}>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Tipo</label>
                    <select name="type" value={filters.type} onChange={handleFilterChange} style={{ width: '100%', padding: '6px' }}>
                        <option value="">Todos</option>
                        <option value="VISITA_GUIADA">Visita Guiada</option>
                        <option value="TALLER">Taller</option>
                        <option value="CHARLA">Charla</option>
                        <option value="EXPOSICION">Exposición</option>
                    </select>
                </div>

                {/* Filtro por Curador */}
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Curador</label>
                    <input type="number" name="curatorId" placeholder="Ej: 2" value={filters.curatorId} onChange={handleFilterChange} style={{ width: '100%', padding: '6px' }} />
                </div>

                {/* Filtro por Fecha Desde */}
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Desde</label>
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} style={{ width: '100%', padding: '6px' }} />
                </div>

                {/* Filtro por Fecha Hasta */}
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Hasta</label>
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} style={{ width: '100%', padding: '6px' }} />
                </div>
            </div>

            {/* Estados de Carga, Error y Resultados */}
            {loading && <p>Cargando eventos del backend...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            {!loading && !error && events.length === 0 && (
                <p>No se encontraron eventos que coincidan con los criterios de búsqueda.</p>
            )}

            {!loading && !error && events.map((item) => (
                <EventCard key={item.id} event={item} />
            ))}
        </div>
    )
}