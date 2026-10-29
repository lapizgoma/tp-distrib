package com.tp_distribuidos.backend_rest.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.tp_distribuidos.backend_rest.enums.EventNewsType;
import com.tp_distribuidos.backend_rest.enums.EventType;
import com.tp_distribuidos.backend_rest.models.entities.EventOutbox;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Mensaje publicado en el topic {@code museum.events}.
 *
 * <p>El identificador {@code messageId} es único por publicación y se conserva
 * en los reintentos para que los consumidores puedan deduplicar. {@code eventId}
 * se usa como clave del registro de Kafka para mantener el orden por evento.
 * En los mensajes {@code EVENT_UPDATED}, {@code changes} contiene únicamente
 * los campos modificados con su valor {@code previous} y {@code current}.</p>
 */
public record EventNewsMessageDTO(
        int schemaVersion,
        String messageId,
        EventNewsType newsType,
        Long eventId,
        String eventTitle,
        LocalDateTime eventDateTime,
        EventType eventType,
        Long leadCuratorId,
        Instant occurredAt,
        Long responsibleUserId,
        String source,
        @JsonInclude(JsonInclude.Include.NON_EMPTY)
        Map<String, EventFieldChangeDTO> changes
) {

    public static final int CURRENT_SCHEMA_VERSION = 1;
    public static final String SOURCE_BACKEND_REST = "backend-rest";

    public static EventNewsMessageDTO fromOutbox(EventOutbox outbox,
                                                 Map<String, EventFieldChangeDTO> changes) {
        return new EventNewsMessageDTO(
                CURRENT_SCHEMA_VERSION,
                outbox.getMessageId(),
                outbox.getNewsType(),
                outbox.getEventId(),
                outbox.getEventTitle(),
                outbox.getEventDateTime(),
                outbox.getEventType(),
                outbox.getLeadCuratorId(),
                outbox.getOccurredAt(),
                outbox.getResponsibleUserId(),
                SOURCE_BACKEND_REST,
                changes
        );
    }
}
