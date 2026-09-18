package com.tp_distribuidos.backend_rest.repositories;

import com.tp_distribuidos.backend_rest.models.embeddable.EventRegistrationId;
import com.tp_distribuidos.backend_rest.models.entities.EventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventRegistrationRepository extends JpaRepository<EventRegistration, EventRegistrationId> {

    List<EventRegistration> findByEventId(Long eventId);

    List<EventRegistration> findByUserId(Long userId);

    boolean existsByEventIdAndUserId(Long eventId, Long userId);

    long countByEventId(Long eventId);
}