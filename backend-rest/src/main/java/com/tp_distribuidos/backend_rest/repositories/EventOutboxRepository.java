package com.tp_distribuidos.backend_rest.repositories;

import com.tp_distribuidos.backend_rest.enums.OutboxStatus;
import com.tp_distribuidos.backend_rest.models.entities.EventOutbox;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface EventOutboxRepository extends JpaRepository<EventOutbox, Long> {

    List<EventOutbox> findByStatusAndNextAttemptAtLessThanEqualOrderByIdAsc(
            OutboxStatus status, Instant now, Pageable pageable);
}
