package com.tp_distribuidos.backend_rest.repositories;

import com.tp_distribuidos.backend_rest.enums.WorkAvailability;
import com.tp_distribuidos.backend_rest.enums.WorkEra;
import com.tp_distribuidos.backend_rest.models.entities.Work;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WorkRepository extends JpaRepository<Work, Long> {

    List<Work> findByArtistId(Long artistId);

    List<Work> findByEra(WorkEra era);

    List<Work> findByAvailability(WorkAvailability availability);

    @Query("SELECT w FROM Work w JOIN FETCH w.artist WHERE w.id = :id")
    Optional<Work> findByIdWithArtist(@Param("id") Long id);

    @Query("SELECT w FROM Work w JOIN FETCH w.artist")
    List<Work> findAllWithArtist();
}