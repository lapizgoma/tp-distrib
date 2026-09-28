package com.tp_distribuidos.backend_rest.controllers;

import com.tp_distribuidos.backend_rest.services.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/rest/reports")
@RequiredArgsConstructor
@Tag(name = "Reportes", description = "Endpoints de exportación de informes del museo")
public class ReportController {

    private static final MediaType XLSX_MEDIA_TYPE =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private static final DateTimeFormatter FILE_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final ReportService reportService;

    @GetMapping("/attendance")
    @PreAuthorize("hasAnyRole('CURADOR', 'ADMINISTRADOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Exportar informe de asistencia",
            description = "Descarga un archivo Excel con la asistencia a los eventos, agrupada en una hoja por tipo de evento.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Informe generado exitosamente"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "No autorizado para exportar informes")
    })
    public ResponseEntity<byte[]> exportAttendanceReport() {
        byte[] report = reportService.generateAttendanceReport();

        String fileName = "reporte-asistencia-" + LocalDate.now().format(FILE_DATE_FORMATTER) + ".xlsx";
        String contentDisposition = ContentDisposition.attachment()
                .filename(fileName)
                .build()
                .toString();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                .contentType(XLSX_MEDIA_TYPE)
                .body(report);
    }
}
