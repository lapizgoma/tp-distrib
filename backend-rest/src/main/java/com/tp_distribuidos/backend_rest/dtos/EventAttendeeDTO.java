package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.models.entities.EventRegistration;
import com.tp_distribuidos.backend_rest.models.entities.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@Schema(description = "Datos de un inscripto a un evento")
public class EventAttendeeDTO {

    @Schema(description = "ID del usuario inscripto", example = "3")
    private Long userId;

    @Schema(description = "Nombre completo del inscripto", example = "Ana Gómez")
    private String name;

    @Schema(description = "Email del inscripto", example = "visitante@museo.com")
    private String email;

    @Schema(description = "Fecha y hora de inscripción", example = "2026-09-25T11:00:00")
    private LocalDateTime registeredAt;

    public static EventAttendeeDTO fromEntity(EventRegistration registration) {
        User user = registration.getUser();

        String firstName = user.getFirstName() != null ? user.getFirstName() : "";
        String lastName = user.getLastName() != null ? user.getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();

        if (fullName.isEmpty()) {
            fullName = user.getEmail();
        }

        return EventAttendeeDTO.builder()
                .userId(user.getId())
                .name(fullName)
                .email(user.getEmail())
                .registeredAt(registration.getRegisteredAt())
                .build();
    }
}
