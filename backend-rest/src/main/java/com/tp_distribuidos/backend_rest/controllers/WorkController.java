package com.tp_distribuidos.backend_rest.controllers;

import com.tp_distribuidos.backend_rest.dtos.WorkDetailDTO;
import com.tp_distribuidos.backend_rest.dtos.WorkFiltersDTO;
import com.tp_distribuidos.backend_rest.dtos.WorkRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.WorkSummaryDTO;
import com.tp_distribuidos.backend_rest.services.WorkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/rest/works")
@RequiredArgsConstructor
@Tag(name = "Obras", description = "Endpoints de consulta y gestión de obras de arte")
public class WorkController {

    private final WorkService workService;

    @GetMapping
    @Operation(summary = "Listar obras", description = "Retorna el resumen de todas las obras registradas.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista recuperada exitosamente")
    })
    public ResponseEntity<List<WorkSummaryDTO>> getAllWorks() {
        return ResponseEntity.ok(workService.getAllWorks());
    }

    @GetMapping("/filters")
    @Operation(summary = "Listar valores de filtro",
            description = "Retorna los valores válidos de era, técnica y ubicación para poblar los filtros del front.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Valores recuperados exitosamente")
    })
    public ResponseEntity<WorkFiltersDTO> getWorkFilters() {
        return ResponseEntity.ok(workService.getFilterOptions());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener detalle de una obra", description = "Retorna la información completa de la obra por ID junto con su artista.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Obra encontrada"),
            @ApiResponse(responseCode = "404", description = "Obra no encontrada")
    })
    public ResponseEntity<WorkDetailDTO> getWorkById(@PathVariable Long id) {
        return ResponseEntity.ok(workService.getWorkById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CURADOR', 'ADMINISTRADOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Crear una obra", description = "Permite a un curador o administrador registrar una nueva obra.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Obra creada exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "No autorizado para crear obras"),
            @ApiResponse(responseCode = "404", description = "Artista no encontrado")
    })
    public ResponseEntity<WorkDetailDTO> createWork(@Valid @RequestBody WorkRequestDTO request) {
        WorkDetailDTO created = workService.createWork(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CURADOR', 'ADMINISTRADOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Actualizar una obra", description = "Permite a un curador o administrador reemplazar los datos de una obra existente.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Obra actualizada exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "No autorizado para modificar obras"),
            @ApiResponse(responseCode = "404", description = "Obra o artista no encontrados")
    })
    public ResponseEntity<WorkDetailDTO> updateWork(@PathVariable Long id,
                                                    @Valid @RequestBody WorkRequestDTO request) {
        return ResponseEntity.ok(workService.updateWork(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CURADOR', 'ADMINISTRADOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Eliminar una obra", description = "Permite a un curador o administrador eliminar una obra junto con sus comentarios.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Obra eliminada exitosamente"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "No autorizado para eliminar obras"),
            @ApiResponse(responseCode = "404", description = "Obra no encontrada")
    })
    public ResponseEntity<Void> deleteWork(@PathVariable Long id) {
        workService.deleteWork(id);
        return ResponseEntity.noContent().build();
    }
}
