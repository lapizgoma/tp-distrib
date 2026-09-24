package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.EventType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class EventRequestDTO {

    @NotBlank(message = "El título es obligatorio")
    @Schema(example = "Noche de Gala en el Museo")
    private String title;

    @Schema(example = "Recorrido nocturno guiado con música en vivo.")
    private String description;

    @NotNull(message = "La fecha y hora son obligatorias")
    @Future(message = "La fecha del evento debe ser futura")
    @Schema(example = "2026-11-15T20:00:00")
    private LocalDateTime datetime;

    @Min(value = 1, message = "La duración mínima es de 1 minuto")
    @Schema(example = "120")
    private Integer duration;

    @NotNull(message = "El ID del curador a cargo es obligatorio")
    @Schema(example = "2")
    private Long leadCuratorId;

    @NotNull(message = "La capacidad máxima es obligatoria")
    @Min(value = 1, message = "La capacidad máxima debe ser al menos 1")
    @Schema(example = "50")
    private Integer maximumCapacity;

    @NotNull(message = "El tipo de evento es obligatorio")
    @Schema(example = "VISITA_GUIADA", allowableValues = {"VISITA_GUIADA", "TALLER", "CHARLA", "EXPOSICION"})
    private EventType eventType;
}