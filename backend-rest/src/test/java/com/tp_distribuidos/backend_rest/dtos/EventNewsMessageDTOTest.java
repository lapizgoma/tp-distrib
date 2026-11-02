package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.EventNewsType;
import com.tp_distribuidos.backend_rest.enums.EventType;
import org.apache.kafka.common.header.Headers;
import org.apache.kafka.common.header.internals.RecordHeaders;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.support.serializer.JacksonJsonSerializer;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class EventNewsMessageDTOTest {

    @Test
    void serializesRequiredFieldsAsPortableJson() {
        EventNewsMessageDTO message = buildMessage();

        byte[] payload = new JacksonJsonSerializer<EventNewsMessageDTO>()
                .serialize("museum.events", message);
        String json = new String(payload, StandardCharsets.UTF_8);

        assertThat(json).contains("\"schemaVersion\":1");
        assertThat(json).contains("\"messageId\":\"7f0c9d2e-4a1b-4c3d-9e8f-123456789abc\"");
        assertThat(json).contains("\"newsType\":\"EVENT_CREATED\"");
        assertThat(json).contains("\"eventId\":12");
        assertThat(json).contains("\"eventTitle\":\"Noche de Gala\"");
        assertThat(json).contains("\"eventDateTime\":\"2026-11-15T20:00:00\"");
        assertThat(json).contains("\"occurredAt\":\"2026-10-29T14:03:11Z\"");
        assertThat(json).contains("\"responsibleUserId\":5");
        assertThat(json).contains("\"source\":\"backend-rest\"");
        assertThat(json).doesNotContain("\"changes\"");
    }

    @Test
    void serializesChangesOnlyForUpdatedEvents() {
        Map<String, EventFieldChangeDTO> changes = new LinkedHashMap<>();
        changes.put("eventTitle", new EventFieldChangeDTO("Noche de Gala", "Noche de Gala Actualizada"));
        changes.put("eventDateTime", new EventFieldChangeDTO(
                "2026-11-15T20:00:00",
                "2026-11-16T21:00:00"
        ));

        EventNewsMessageDTO message = buildMessage(EventNewsType.EVENT_UPDATED, changes);
        byte[] payload = new JacksonJsonSerializer<EventNewsMessageDTO>()
                .serialize("museum.events", message);
        String json = new String(payload, StandardCharsets.UTF_8);

        assertThat(json).contains("\"newsType\":\"EVENT_UPDATED\"");
        assertThat(json).contains("\"eventTitle\":{\"previous\":\"Noche de Gala\",\"current\":\"Noche de Gala Actualizada\"}");
        assertThat(json).contains("\"eventDateTime\":{\"previous\":\"2026-11-15T20:00:00\",\"current\":\"2026-11-16T21:00:00\"}");
    }

    @Test
    void doesNotAddSpringTypeHeadersWhenDisabled() {
        JacksonJsonSerializer<EventNewsMessageDTO> serializer = new JacksonJsonSerializer<>();
        serializer.configure(
                Map.of(JacksonJsonSerializer.ADD_TYPE_INFO_HEADERS, false),
                false
        );
        Headers headers = new RecordHeaders();

        serializer.serialize("museum.events", headers, buildMessage());

        assertThat(headers.lastHeader("__TypeId__")).isNull();
    }

    private EventNewsMessageDTO buildMessage() {
        return buildMessage(EventNewsType.EVENT_CREATED, null);
    }

    private EventNewsMessageDTO buildMessage(EventNewsType newsType,
                                             Map<String, EventFieldChangeDTO> changes) {
        return new EventNewsMessageDTO(
                EventNewsMessageDTO.CURRENT_SCHEMA_VERSION,
                "7f0c9d2e-4a1b-4c3d-9e8f-123456789abc",
                newsType,
                12L,
                "Noche de Gala",
                LocalDateTime.of(2026, 11, 15, 20, 0),
                EventType.VISITA_GUIADA,
                2L,
                Instant.parse("2026-10-29T14:03:11Z"),
                5L,
                EventNewsMessageDTO.SOURCE_BACKEND_REST,
                changes
        );
    }
}
