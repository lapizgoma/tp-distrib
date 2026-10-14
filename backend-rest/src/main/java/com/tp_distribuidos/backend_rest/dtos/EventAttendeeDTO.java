package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.models.entities.EventRegistration;
import com.tp_distribuidos.backend_rest.models.entities.User;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "Datos de un inscripto a un evento")
public record EventAttendeeDTO(

        @Schema(description = "ID del usuario inscripto", example = "3")
        Long userId,

        @Schema(description = "Nombre completo del inscripto", example = "Ana Gómez")
        String name,

        @Schema(description = "Email del inscripto", example = "visitante@museo.com")
        String email,

        @Schema(description = "Fecha y hora de inscripción", example = "2026-09-25T11:00:00")
        LocalDateTime registeredAt
) {

    public static EventAttendeeDTO fromEntity(EventRegistration registration) {
        User user = registration.getUser();

        String firstName = user.getFirstName() != null ? user.getFirstName() : "";
        String lastName = user.getLastName() != null ? user.getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();

        if (fullName.isEmpty()) {
            fullName = user.getEmail();
        }

        return new EventAttendeeDTO(
                user.getId(),
                fullName,
                user.getEmail(),
                registration.getRegisteredAt());
    }
}
