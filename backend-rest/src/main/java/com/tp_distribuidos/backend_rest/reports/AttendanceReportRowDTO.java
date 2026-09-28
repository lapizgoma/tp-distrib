package com.tp_distribuidos.backend_rest.reports;

import java.time.LocalDateTime;

/**
 * Fila interna del informe de asistencia.
 *
 * <p>No forma parte del contrato HTTP: es un modelo de transferencia entre la
 * recolección de datos y el render del Excel.</p>
 */
public record AttendanceReportRowDTO(
        LocalDateTime date,
        String title,
        String curator,
        long registered,
        Integer maxCapacity,
        double occupancyRate
) {
}
