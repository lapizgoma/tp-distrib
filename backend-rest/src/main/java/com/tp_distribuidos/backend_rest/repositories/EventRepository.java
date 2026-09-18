package com.tp_distribuidos.backend_rest.repositories;

import com.tp_distribuidos.backend_rest.enums.EventType;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByLeadCuratorId(Long leadCuratorId);

    List<Event> findByEventType(EventType eventType);

    List<Event> findByDatetimeBetween(LocalDateTime from, LocalDateTime to);
}