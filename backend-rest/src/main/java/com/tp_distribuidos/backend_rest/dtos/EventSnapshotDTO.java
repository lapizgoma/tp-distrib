package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.EventType;
import com.tp_distribuidos.backend_rest.models.entities.Event;

import java.time.LocalDateTime;

/**
 * Snapshot de los datos editables de un evento.
 *
 * <p>Se usa para comparar el estado anterior y posterior de una modificación
 * dentro de la misma transacción, antes de persistir la novedad en el outbox.</p>
 */
public record EventSnapshotDTO(
        String eventTitle,
        String description,
        LocalDateTime eventDateTime,
        Integer duration,
        Long leadCuratorId,
        Integer maximumCapacity,
        EventType eventType
) {

    public static EventSnapshotDTO fromEntity(Event event) {
        return new EventSnapshotDTO(
                event.getTitle(),
                event.getDescription(),
                event.getDatetime(),
                event.getDuration(),
                event.getLeadCurator() != null ? event.getLeadCurator().getId() : null,
                event.getMaximumCapacity(),
                event.getEventType()
        );
    }
}
