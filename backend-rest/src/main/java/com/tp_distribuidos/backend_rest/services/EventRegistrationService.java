package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.EventRegistrationRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.EventRegistrationResponseDTO;
import com.tp_distribuidos.backend_rest.exceptions.ApiException;
import com.tp_distribuidos.backend_rest.models.embeddable.EventRegistrationId;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import com.tp_distribuidos.backend_rest.models.entities.EventRegistration;
import com.tp_distribuidos.backend_rest.models.entities.User;
import com.tp_distribuidos.backend_rest.repositories.EventRegistrationRepository;
import com.tp_distribuidos.backend_rest.repositories.EventRepository;
import com.tp_distribuidos.backend_rest.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EventRegistrationService {

    private final EventRegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No hay un usuario autenticado en la sesión.");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuario autenticado no encontrado: " + auth.getName()));
    }

    @Transactional
    public EventRegistrationResponseDTO registerMember(EventRegistrationRequestDTO request) {
        User user = getAuthenticatedUser();
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Evento no encontrado con ID: " + request.getEventId()));

        if (registrationRepository.existsByEventIdAndUserId(event.getId(), user.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El usuario ya se encuentra inscripto a este evento.");
        }

        // Validación de cupo máximo
        if (event.getMaximumCapacity() != null) {
            long currentCount = registrationRepository.countByEventId(event.getId());
            if (currentCount >= event.getMaximumCapacity()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "El cupo máximo del evento ha sido alcanzado (" + event.getMaximumCapacity() + ").");
            }
        }

        EventRegistration registration = EventRegistration.of(event, user);
        EventRegistration saved = registrationRepository.save(registration);
        return EventRegistrationResponseDTO.fromEntity(saved);
    }

    @Transactional
    public void unregisterMember(EventRegistrationRequestDTO request) {
        User user = getAuthenticatedUser();
        EventRegistrationId regId = new EventRegistrationId(request.getEventId(), user.getId());

        if (!registrationRepository.existsById(regId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "No se encontró una inscripción activa para este evento y usuario.");
        }

        registrationRepository.deleteById(regId);
    }
}