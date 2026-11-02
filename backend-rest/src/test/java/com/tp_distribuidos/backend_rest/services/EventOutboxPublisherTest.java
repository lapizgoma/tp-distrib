package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.EventFieldChangeDTO;
import com.tp_distribuidos.backend_rest.dtos.EventNewsMessageDTO;
import com.tp_distribuidos.backend_rest.enums.EventNewsType;
import com.tp_distribuidos.backend_rest.enums.EventType;
import com.tp_distribuidos.backend_rest.enums.OutboxStatus;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import com.tp_distribuidos.backend_rest.models.entities.EventOutbox;
import com.tp_distribuidos.backend_rest.publisher.EventOutboxPublisher;
import com.tp_distribuidos.backend_rest.repositories.EventOutboxRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventOutboxPublisherTest {

    private static final String TOPIC = "museum.events";
    private static final Long EVENT_ID = 12L;

    @Mock
    private EventOutboxRepository eventOutboxRepository;

    @Mock
    private KafkaTemplate<String, EventNewsMessageDTO> kafkaTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private EventOutboxPublisher publisher;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(publisher, "eventsTopic", TOPIC);
        ReflectionTestUtils.setField(publisher, "batchSize", 50);
        ReflectionTestUtils.setField(publisher, "sendTimeoutSeconds", 1L);
        ReflectionTestUtils.setField(publisher, "baseBackoffMs", 1000L);
        ReflectionTestUtils.setField(publisher, "maxBackoffMs", 60000L);
    }

    @Test
    @SuppressWarnings("unchecked")
    void marksPendingMessageAsSentWhenKafkaAcknowledges() {
        EventOutbox outbox = pendingOutbox();
        when(eventOutboxRepository.findByStatusAndNextAttemptAtLessThanEqualOrderByIdAsc(
                eq(OutboxStatus.PENDING), any(Instant.class), any(PageRequest.class)))
                .thenReturn(List.of(outbox));

        SendResult<String, EventNewsMessageDTO> sendResult = mock(SendResult.class);
        when(kafkaTemplate.send(eq(TOPIC), eq(String.valueOf(EVENT_ID)), any(EventNewsMessageDTO.class)))
                .thenReturn(CompletableFuture.completedFuture(sendResult));

        publisher.publishPending();

        assertThat(outbox.getStatus()).isEqualTo(OutboxStatus.SENT);
        assertThat(outbox.getSentAt()).isNotNull();
        verify(eventOutboxRepository).save(outbox);
    }

    @Test
    void keepsMessagePendingAndSchedulesRetryWhenKafkaFails() {
        EventOutbox outbox = pendingOutbox();
        when(eventOutboxRepository.findByStatusAndNextAttemptAtLessThanEqualOrderByIdAsc(
                eq(OutboxStatus.PENDING), any(Instant.class), any(PageRequest.class)))
                .thenReturn(List.of(outbox));
        when(kafkaTemplate.send(eq(TOPIC), eq(String.valueOf(EVENT_ID)), any(EventNewsMessageDTO.class)))
                .thenReturn(CompletableFuture.failedFuture(new RuntimeException("Kafka down")));

        publisher.publishPending();

        assertThat(outbox.getStatus()).isEqualTo(OutboxStatus.PENDING);
        assertThat(outbox.getAttempts()).isEqualTo(1);
        assertThat(outbox.getLastError()).contains("Kafka down");
        assertThat(outbox.getNextAttemptAt()).isAfter(Instant.now().minusSeconds(1));
        verify(eventOutboxRepository).save(outbox);
    }

    @Test
    @SuppressWarnings("unchecked")
    void publishesUpdateChangesStoredInOutbox() {
        String changesJson = "{\"eventTitle\":{\"previous\":\"Viejo\",\"current\":\"Nuevo\"}}";
        EventOutbox outbox = pendingOutbox(EventNewsType.EVENT_UPDATED, changesJson);
        Map<String, EventFieldChangeDTO> changes = new LinkedHashMap<>();
        changes.put("eventTitle", new EventFieldChangeDTO("Viejo", "Nuevo"));

        when(eventOutboxRepository.findByStatusAndNextAttemptAtLessThanEqualOrderByIdAsc(
                eq(OutboxStatus.PENDING), any(Instant.class), any(PageRequest.class)))
                .thenReturn(List.of(outbox));
        when(objectMapper.readValue(
                eq(changesJson),
                org.mockito.ArgumentMatchers.<TypeReference<Map<String, EventFieldChangeDTO>>>any()))
                .thenReturn(changes);

        SendResult<String, EventNewsMessageDTO> sendResult = mock(SendResult.class);
        when(kafkaTemplate.send(eq(TOPIC), eq(String.valueOf(EVENT_ID)), any(EventNewsMessageDTO.class)))
                .thenReturn(CompletableFuture.completedFuture(sendResult));

        publisher.publishPending();

        ArgumentCaptor<EventNewsMessageDTO> messageCaptor = ArgumentCaptor.forClass(EventNewsMessageDTO.class);
        verify(kafkaTemplate).send(eq(TOPIC), eq(String.valueOf(EVENT_ID)), messageCaptor.capture());
        assertThat(messageCaptor.getValue().newsType()).isEqualTo(EventNewsType.EVENT_UPDATED);
        assertThat(messageCaptor.getValue().changes())
                .containsEntry("eventTitle", new EventFieldChangeDTO("Viejo", "Nuevo"));
        assertThat(outbox.getStatus()).isEqualTo(OutboxStatus.SENT);
    }

    private EventOutbox pendingOutbox() {
        return pendingOutbox(EventNewsType.EVENT_CREATED, null);
    }

    private EventOutbox pendingOutbox(EventNewsType newsType, String changesJson) {
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
        return EventOutbox.pending(
                event,
                newsType,
                "7f0c9d2e-4a1b-4c3d-9e8f-123456789abc",
                null,
                Instant.now(),
                changesJson
        );
    }
}
