package com.tp_distribuidos.backend_rest.models.entities;

import com.tp_distribuidos.backend_rest.models.embeddable.EventRegistrationId;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "events_registrations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EventRegistration {

    @EmbeddedId
    private EventRegistrationId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("eventId")
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("userId")
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "registered_at", nullable = false)
    private LocalDateTime registeredAt;

    public static EventRegistration of(Event event, User user) {
        EventRegistration registration = new EventRegistration();
        registration.event = event;
        registration.user = user;
        registration.id = new EventRegistrationId(event.getId(), user.getId());
        registration.registeredAt = LocalDateTime.now();
        return registration;
    }

    @PrePersist
    protected void onCreate() {
        if (registeredAt == null) {
            registeredAt = LocalDateTime.now();
        }
    }
}