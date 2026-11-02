package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.EventFieldChangeDTO;
import com.tp_distribuidos.backend_rest.enums.EventNewsType;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import com.tp_distribuidos.backend_rest.models.entities.EventOutbox;
import com.tp_distribuidos.backend_rest.repositories.EventOutboxRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Encola novedades de eventos dentro de la transacción de negocio.
 *
 * <p>La propagación {@link Propagation#MANDATORY} evita que se guarde una fila
 * outbox fuera de la transacción que modifica el evento: si la operación
 * principal hace rollback, la novedad también. Para las modificaciones, el
 * mapa {@code changes} se serializa en ese mismo instante para conservar el
 * estado anterior y posterior aunque el evento vuelva a cambiar antes de que
 * el worker publique.</p>
 */
@Service
@RequiredArgsConstructor
public class EventOutboxService {

    private final EventOutboxRepository eventOutboxRepository;
    private final ObjectMapper objectMapper;

    @Transactional(propagation = Propagation.MANDATORY)
    public String enqueue(Event event, EventNewsType newsType, Long responsibleUserId,
                          Instant occurredAt, Map<String, EventFieldChangeDTO> changes) {
        String messageId = UUID.randomUUID().toString();
        String changesJson = changes == null || changes.isEmpty()
                ? null
                : objectMapper.writeValueAsString(changes);
        EventOutbox outbox = EventOutbox.pending(
                event,
                newsType,
                messageId,
                responsibleUserId,
                occurredAt,
                changesJson
        );
        eventOutboxRepository.save(outbox);
        return messageId;
    }
}
