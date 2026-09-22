package com.tp_distribuidos.backend_rest.controllers;

import com.tp_distribuidos.backend_rest.dtos.WorkDetailDTO;
import com.tp_distribuidos.backend_rest.services.WorkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rest/works")
@RequiredArgsConstructor
@Tag(name = "Obras", description = "Endpoints de consulta de obras de arte")
public class WorkController {

    private final WorkService workService;

    @GetMapping("/{id}")
    @Operation(summary = "Obtener detalle de una obra", description = "Retorna la información completa de la obra por ID junto con su artista.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Obra encontrada"),
            @ApiResponse(responseCode = "404", description = "Obra no encontrada")
    })
    public ResponseEntity<WorkDetailDTO> getWorkById(@PathVariable Long id) {
        return ResponseEntity.ok(workService.getWorkById(id));
    }
}