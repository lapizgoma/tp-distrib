package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.models.entities.EventRegistration;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Detalle de confirmación de inscripción")
public class EventRegistrationResponseDTO {

    @Schema(description = "ID del evento", example = "1")
    private Long eventId;

    @Schema(description = "Título del evento", example = "Visita Guiada Nocturna")
    private String eventTitle;

    @Schema(description = "ID del usuario inscripto", example = "3")
    private Long userId;

    @Schema(description = "Email del usuario", example = "visitante@museo.com")
    private String userEmail;

    @Schema(description = "Fecha y hora de registro", example = "2026-09-25T11:00:00")
    private LocalDateTime registeredAt;

    public static EventRegistrationResponseDTO fromEntity(EventRegistration reg) {
        return new EventRegistrationResponseDTO(
                reg.getEvent().getId(),
                reg.getEvent().getTitle(),
                reg.getUser().getId(),
                reg.getUser().getEmail(),
                reg.getRegisteredAt()
        );
    }
}