package com.tp_distribuidos.backend_rest.repositories;

import com.tp_distribuidos.backend_rest.models.entities.Artist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArtistRepository extends JpaRepository<Artist, Long> {

    List<Artist> findByNameContainingIgnoreCase(String name);

    boolean existsByName(String name);
}