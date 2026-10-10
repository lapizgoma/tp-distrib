package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.EventStatus;
import com.tp_distribuidos.backend_rest.enums.EventType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter
@Setter
public class AttendanceReportFilterRequestDTO {

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    @Schema(example = "2026-01-31", description = "Fecha de inicio del rango (inclusive), en formato YYYY-MM-DD. Opcional.")
    private LocalDate startDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    @Schema(example = "2026-02-28", description = "Fecha de fin del rango (exclusiva), en formato YYYY-MM-DD. Opcional.")
    private LocalDate endDate;

    @Schema(example = "VISITA_GUIADA", allowableValues = {"VISITA_GUIADA", "TALLER", "CHARLA", "EXPOSICION"},
            description = "Filtra por tipo de evento. Opcional.")
    private EventType type;

    @Schema(example = "UPCOMING", allowableValues = {"ENDED", "UPCOMING", "ALL"},
            description = "Filtra por estado temporal: ENDED (ya ocurrieron), UPCOMING (están por ocurrir) "
                    + "o ALL (sin filtro). Valor por defecto: ALL.")
    private EventStatus status = EventStatus.ALL;
}
