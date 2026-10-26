package com.tp_distribuidos.backend_rest.repositories;

import com.tp_distribuidos.backend_rest.models.entities.UserWorkInteraction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserWorkInteractionRepository extends JpaRepository<UserWorkInteraction, Long> {
}
