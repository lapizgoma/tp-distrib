package com.tp_distribuidos.backend_rest.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Datos para inscribirse o cancelar inscripción en un evento")
public class EventRegistrationRequestDTO {

    @NotNull(message = "El ID del evento es obligatorio")
    @Schema(description = "Identificador del evento", example = "1")
    private Long eventId;
}