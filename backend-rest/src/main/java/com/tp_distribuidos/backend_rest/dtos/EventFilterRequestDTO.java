package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.EventType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@Getter
@Setter
public class EventFilterRequestDTO {

    @Schema(example = "VISITA_GUIADA", allowableValues = {"VISITA_GUIADA", "TALLER", "CHARLA", "EXPOSICION"},
            description = "Filtra por tipo de evento. Opcional.")
    private EventType eventType;

    @Schema(example = "2", description = "Filtra por ID del curador a cargo. Opcional.")
    private Long curadorId;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    @Schema(example = "2026-01-01T00:00:00", description = "Fecha y hora mínima (inclusive). Opcional.")
    private LocalDateTime fechaDesde;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    @Schema(example = "2026-12-31T23:59:59", description = "Fecha y hora máxima (inclusive). Opcional.")
    private LocalDateTime fechaHasta;
}
