package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.EventType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter
@Setter
public class EventFilterRequestDTO {

    @Schema(example = "VISITA_GUIADA", allowableValues = {"VISITA_GUIADA", "TALLER", "CHARLA", "EXPOSICION"},
            description = "Filtra por tipo de evento. Opcional.")
    private EventType type;

    @Schema(example = "2", description = "Filtra por ID del curador a cargo. Opcional.")
    private Long curatorId;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    @Schema(example = "2026-01-01", description = "Fecha de inicio del rango (inclusive), en formato YYYY-MM-DD. Opcional.")
    private LocalDate startDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    @Schema(example = "2026-12-31", description = "Fecha de fin del rango (exclusiva), en formato YYYY-MM-DD. Opcional.")
    private LocalDate endDate;
}
