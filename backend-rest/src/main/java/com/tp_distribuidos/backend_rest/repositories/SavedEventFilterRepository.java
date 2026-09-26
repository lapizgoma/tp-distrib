package com.tp_distribuidos.backend_rest.repositories;

import com.tp_distribuidos.backend_rest.models.entities.SavedEventFilter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedEventFilterRepository extends JpaRepository<SavedEventFilter, Long> {

    List<SavedEventFilter> findByUserId(Long userId);

    Optional<SavedEventFilter> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndNameIgnoreCase(Long userId, String name);
}