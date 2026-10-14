package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.models.entities.EventRegistration;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "Detalle de confirmación de inscripción")
public record EventRegistrationResponseDTO(

        @Schema(description = "ID del evento", example = "1")
        Long eventId,

        @Schema(description = "Título del evento", example = "Visita Guiada Nocturna")
        String eventTitle,

        @Schema(description = "ID del usuario inscripto", example = "3")
        Long userId,

        @Schema(description = "Email del usuario", example = "visitante@museo.com")
        String userEmail,

        @Schema(description = "Fecha y hora de registro", example = "2026-09-25T11:00:00")
        LocalDateTime registeredAt
) {

    public static EventRegistrationResponseDTO fromEntity(EventRegistration reg) {
        return new EventRegistrationResponseDTO(
                reg.getEvent().getId(),
                reg.getEvent().getTitle(),
                reg.getUser().getId(),
                reg.getUser().getEmail(),
                reg.getRegisteredAt());
    }
}
