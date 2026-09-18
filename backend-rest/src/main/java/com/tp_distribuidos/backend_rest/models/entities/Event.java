package com.tp_distribuidos.backend_rest.models.entities;

import com.tp_distribuidos.backend_rest.enums.EventType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime datetime;

    private Integer duration;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lead_curator_id", nullable = false)
    private User leadCurator;

    @Column(name = "maximum_capacity", nullable = false)
    private Integer maximumCapacity;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 20)
    private EventType eventType;

    @OneToMany(mappedBy = "event", fetch = FetchType.LAZY)
    private List<EventRegistration> registrations = new ArrayList<>();

    public static Event of(String title, LocalDateTime datetime, User leadCurator,
                           Integer maximumCapacity, EventType eventType) {
        Event event = new Event();
        event.title = title;
        event.datetime = datetime;
        event.leadCurator = leadCurator;
        event.maximumCapacity = maximumCapacity;
        event.eventType = eventType;
        return event;
    }

    public static Event of(String title, String description, LocalDateTime datetime, Integer duration,
                           User leadCurator, Integer maximumCapacity, EventType eventType) {
        Event event = of(title, datetime, leadCurator, maximumCapacity, eventType);
        event.description = description;
        event.duration = duration;
        return event;
    }
}