package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.enums.InteractionType;
import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.models.entities.User;
import com.tp_distribuidos.backend_rest.models.entities.UserWorkInteraction;
import com.tp_distribuidos.backend_rest.models.entities.Work;
import com.tp_distribuidos.backend_rest.repositories.UserWorkInteractionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserWorkInteractionService {

    private final UserWorkInteractionRepository interactionRepository;

    /**
     * Registra una interacción de tipo COMMENT.
     *
     * <p>Solo los usuarios con rol {@link UserRole#VISITANTE} generan actividad.
     * Para los demás roles el método no hace nada.</p>
     *
     * @param user autor del comentario.
     * @param work obra comentada.
     */
    @Transactional
    public void recordComment(User user, Work work) {
        if (user.getRole() != UserRole.VISITANTE) {
            return;
        }
        interactionRepository.save(UserWorkInteraction.of(user, work, InteractionType.COMMENT));
    }
}
