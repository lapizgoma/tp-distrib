package com.tp_distribuidos.backend_rest.models.entities;

import com.tp_distribuidos.backend_rest.enums.EventNewsType;
import com.tp_distribuidos.backend_rest.enums.EventType;
import com.tp_distribuidos.backend_rest.enums.OutboxStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Fila del patrón Transactional Outbox.
 *
 * <p>Se guarda en la misma transacción MySQL que la operación sobre el evento.
 * Un worker independiente la publica en Kafka y recién entonces la marca como
 * {@link OutboxStatus#SENT}. Si Kafka no está disponible, la fila permanece
 * {@link OutboxStatus#PENDING} y se reintenta con backoff.</p>
 */
@Entity
@Table(name = "event_outbox", indexes = {
        @Index(name = "idx_event_outbox_pending", columnList = "status,next_attempt_at")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EventOutbox {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "message_id", nullable = false, unique = true, length = 36)
    private String messageId;

    @Enumerated(EnumType.STRING)
    @Column(name = "news_type", nullable = false, length = 30)
    private EventNewsType newsType;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "event_title", nullable = false, length = 255)
    private String eventTitle;

    @Column(name = "event_datetime")
    private LocalDateTime eventDateTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", length = 20)
    private EventType eventType;

    @Column(name = "lead_curator_id")
    private Long leadCuratorId;

    @Column(name = "occurred_at", nullable = false, columnDefinition = "DATETIME(3)")
    private Instant occurredAt;

    @Column(name = "responsible_user_id")
    private Long responsibleUserId;

    @Column(name = "changes_json", columnDefinition = "TEXT")
    private String changesJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OutboxStatus status;

    @Column(name = "attempts", nullable = false)
    private int attempts;

    @Column(name = "next_attempt_at", nullable = false, columnDefinition = "DATETIME(3)")
    private Instant nextAttemptAt;

    @Column(name = "sent_at", columnDefinition = "DATETIME(3)")
    private Instant sentAt;

    @Column(name = "last_error", length = 500)
    private String lastError;

    public static EventOutbox pending(Event event, EventNewsType newsType,
                                      String messageId, Long responsibleUserId,
                                      Instant occurredAt, String changesJson) {
        EventOutbox outbox = new EventOutbox();
        outbox.messageId = messageId;
        outbox.newsType = newsType;
        outbox.eventId = event.getId();
        outbox.eventTitle = event.getTitle();
        outbox.eventDateTime = event.getDatetime();
        outbox.eventType = event.getEventType();
        outbox.leadCuratorId = event.getLeadCurator() != null
                ? event.getLeadCurator().getId()
                : null;
        outbox.occurredAt = occurredAt;
        outbox.responsibleUserId = responsibleUserId;
        outbox.changesJson = changesJson;
        outbox.status = OutboxStatus.PENDING;
        outbox.attempts = 0;
        outbox.nextAttemptAt = occurredAt;
        return outbox;
    }

    public void markSent(Instant sentAt) {
        this.status = OutboxStatus.SENT;
        this.sentAt = sentAt;
        this.lastError = null;
    }

    public void markFailed(String error, Instant nextAttemptAt) {
        this.attempts++;
        this.lastError = truncate(error, 500);
        this.nextAttemptAt = nextAttemptAt;
    }

    private static String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
