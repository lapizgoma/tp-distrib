package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.EventFieldChangeDTO;
import com.tp_distribuidos.backend_rest.enums.EventNewsType;
import com.tp_distribuidos.backend_rest.enums.EventType;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import com.tp_distribuidos.backend_rest.models.entities.EventOutbox;
import com.tp_distribuidos.backend_rest.repositories.EventOutboxRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class EventOutboxServiceTest {

    private static final Long EVENT_ID = 12L;

    @Mock
    private EventOutboxRepository eventOutboxRepository;

    private final ObjectMapper objectMapper = JsonMapper.builder().build();

    private EventOutboxService eventOutboxService;

    @BeforeEach
    void setUp() {
        eventOutboxService = new EventOutboxService(eventOutboxRepository, objectMapper);
    }

    @Test
    void serializesChangesAtEnqueueTime() {
        Map<String, EventFieldChangeDTO> changes = new LinkedHashMap<>();
        changes.put("eventTitle", new EventFieldChangeDTO("Viejo", "Nuevo"));
        changes.put("leadCuratorId", new EventFieldChangeDTO(2L, 3L));

        eventOutboxService.enqueue(
                buildEvent(),
                EventNewsType.EVENT_UPDATED,
                1L,
                Instant.parse("2026-10-29T21:49:50Z"),
                changes
        );

        ArgumentCaptor<EventOutbox> captor = ArgumentCaptor.forClass(EventOutbox.class);
        verify(eventOutboxRepository).save(captor.capture());
        EventOutbox outbox = captor.getValue();

        assertThat(outbox.getChangesJson())
                .contains("\"eventTitle\":{\"previous\":\"Viejo\",\"current\":\"Nuevo\"}")
                .contains("\"leadCuratorId\":{\"previous\":2,\"current\":3}");

        Map<String, EventFieldChangeDTO> parsed = objectMapper.readValue(
                outbox.getChangesJson(),
                new TypeReference<Map<String, EventFieldChangeDTO>>() {
                }
        );
        assertThat(parsed.get("eventTitle"))
                .isEqualTo(new EventFieldChangeDTO("Viejo", "Nuevo"));
        assertThat(parsed.get("leadCuratorId"))
                .isEqualTo(new EventFieldChangeDTO(2, 3));
    }

    @Test
    void leavesChangesJsonNullWhenThereAreNoChanges() {
        eventOutboxService.enqueue(
                buildEvent(),
                EventNewsType.EVENT_CREATED,
                1L,
                Instant.parse("2026-10-29T21:49:50Z"),
                null
        );

        ArgumentCaptor<EventOutbox> captor = ArgumentCaptor.forClass(EventOutbox.class);
        verify(eventOutboxRepository).save(captor.capture());

        assertThat(captor.getValue().getChangesJson()).isNull();
    }

    private Event buildEvent() {
        Event event = Event.of(
                "Noche de Gala",
                "desc",
                LocalDateTime.now().plusDays(1),
                120,
                null,
                50,
                EventType.VISITA_GUIADA
        );
        ReflectionTestUtils.setField(event, "id", EVENT_ID);
        return event;
    }
}
