package com.tp_distribuidos.backend_rest.repositories;

import com.tp_distribuidos.backend_rest.enums.WorkAvailability;
import com.tp_distribuidos.backend_rest.models.entities.Work;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkRepository extends JpaRepository<Work, Long> {

    List<Work> findByArtistId(Long artistId);

    List<Work> findByEra(String era);

    List<Work> findByAvailability(WorkAvailability availability);
}