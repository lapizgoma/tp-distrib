package com.tp_distribuidos.backend_rest.repositories;

import com.tp_distribuidos.backend_rest.enums.EventType;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByLeadCuratorId(Long leadCuratorId);

    List<Event> findByEventType(EventType eventType);

    List<Event> findByDatetimeBetween(LocalDateTime from, LocalDateTime to);

    @Query("SELECT e FROM Event e JOIN FETCH e.leadCurator ORDER BY e.datetime ASC")
    List<Event> findAllWithCurator();

    @Query("SELECT e FROM Event e JOIN FETCH e.leadCurator WHERE e.id = :id")
    Optional<Event> findByIdWithCurator(@Param("id") Long id);
}