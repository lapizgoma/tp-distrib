package com.tp_distribuidos.backend_rest.publisher;

import com.tp_distribuidos.backend_rest.dtos.EventFieldChangeDTO;
import com.tp_distribuidos.backend_rest.dtos.EventNewsMessageDTO;
import com.tp_distribuidos.backend_rest.enums.OutboxStatus;
import com.tp_distribuidos.backend_rest.models.entities.EventOutbox;
import com.tp_distribuidos.backend_rest.repositories.EventOutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Publica en Kafka las novedades pendientes de la tabla outbox.
 *
 * <p>El envío se hace fuera de la transacción HTTP. Si Kafka está caído, el
 * mensaje queda persistido en MySQL y se reintenta con backoff exponencial. La
 * garantía es at-least-once: un mensaje puede repetirse si Kafka confirma pero
 * falla el marcado de la fila como enviada.</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EventOutboxPublisher {

    private final EventOutboxRepository eventOutboxRepository;
    private final KafkaTemplate<String, EventNewsMessageDTO> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.kafka.topics.events}")
    private String eventsTopic;

    @Value("${app.kafka.outbox.batch-size:50}")
    private int batchSize;

    @Value("${app.kafka.outbox.send-timeout-seconds:15}")
    private long sendTimeoutSeconds;

    @Value("${app.kafka.outbox.base-backoff-ms:1000}")
    private long baseBackoffMs;

    @Value("${app.kafka.outbox.max-backoff-ms:60000}")
    private long maxBackoffMs;

    @Scheduled(
            fixedDelayString = "${app.kafka.outbox.poll-interval-ms:2000}",
            initialDelayString = "${app.kafka.outbox.initial-delay-ms:5000}"
    )
    public void publishPending() {
        Instant now = Instant.now();
        List<EventOutbox> pending = eventOutboxRepository
                .findByStatusAndNextAttemptAtLessThanEqualOrderByIdAsc(
                        OutboxStatus.PENDING,
                        now,
                        PageRequest.of(0, batchSize)
                );

        for (EventOutbox outbox : pending) {
            if (!publishOne(outbox)) {
                return;
            }
        }
    }

    private boolean publishOne(EventOutbox outbox) {
        try {
            Map<String, EventFieldChangeDTO> changes = readChanges(outbox);
            kafkaTemplate.send(
                    eventsTopic,
                    String.valueOf(outbox.getEventId()),
                    EventNewsMessageDTO.fromOutbox(outbox, changes)
            ).get(sendTimeoutSeconds, TimeUnit.SECONDS);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.warn("Publicación outbox interrumpida. messageId={}", outbox.getMessageId());
            return false;
        } catch (Exception ex) {
            registerFailure(outbox, ex);
            return true;
        }

        outbox.markSent(Instant.now());
        try {
            eventOutboxRepository.save(outbox);
            log.info("Novedad publicada. messageId={}, eventId={}, newsType={}",
                    outbox.getMessageId(), outbox.getEventId(), outbox.getNewsType());
        } catch (Exception ex) {
            // El mensaje ya está en Kafka. Se reintentará y el consumidor deberá deduplicar.
            log.error("Mensaje publicado pero no se pudo marcar como SENT. messageId={}",
                    outbox.getMessageId(), ex);
        }
        return true;
    }

    private Map<String, EventFieldChangeDTO> readChanges(EventOutbox outbox) {
        if (outbox.getChangesJson() == null || outbox.getChangesJson().isBlank()) {
            return null;
        }
        return objectMapper.readValue(
                outbox.getChangesJson(),
                new TypeReference<Map<String, EventFieldChangeDTO>>() {
                }
        );
    }

    private void registerFailure(EventOutbox outbox, Exception ex) {
        int nextAttempt = outbox.getAttempts() + 1;
        long delayMs = calculateBackoff(nextAttempt);
        outbox.markFailed(rootMessage(ex), Instant.now().plusMillis(delayMs));

        try {
            eventOutboxRepository.save(outbox);
        } catch (Exception dbEx) {
            log.error("No se pudo guardar el fallo de outbox. messageId={}",
                    outbox.getMessageId(), dbEx);
        }

        log.warn("No se pudo publicar novedad. messageId={}, eventId={}, intento={}, reintentoEnMs={}, error={}",
                outbox.getMessageId(), outbox.getEventId(), nextAttempt, delayMs, outbox.getLastError());
        log.debug("Detalle del fallo de publicación", ex);
    }

    private long calculateBackoff(int attempt) {
        int exponent = Math.min(Math.max(attempt - 1, 0), 10);
        long base = baseBackoffMs * (1L << exponent);
        return Math.min(base, maxBackoffMs);
    }

    private String rootMessage(Throwable throwable) {
        Throwable cause = throwable;
        while (cause.getCause() != null && cause.getCause() != cause) {
            cause = cause.getCause();
        }
        String message = cause.getMessage();
        return message != null
                ? cause.getClass().getSimpleName() + ": " + message
                : cause.getClass().getSimpleName();
    }
}
