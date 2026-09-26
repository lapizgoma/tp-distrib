package com.tp_distribuidos.backend_rest.controllers;

import com.tp_distribuidos.backend_rest.dtos.SavedEventFilterRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.SavedEventFilterResponseDTO;
import com.tp_distribuidos.backend_rest.services.SavedEventFilterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rest/filters")
@RequiredArgsConstructor
@Tag(name = "Filtros de Eventos", description = "Endpoints para la gestión de filtros de búsqueda guardados de eventos")
@SecurityRequirement(name = "bearerAuth")
public class SavedEventFilterController {

    private final SavedEventFilterService filterService;

    @Operation(summary = "Listar filtros guardados del usuario autenticado")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Filtros obtenidos exitosamente"),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    })
    @GetMapping
    public ResponseEntity<List<SavedEventFilterResponseDTO>> getAll() {
        return ResponseEntity.ok(filterService.getAllForCurrentUser());
    }

    @Operation(summary = "Obtener detalle de un filtro guardado por ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Filtro obtenido exitosamente"),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
            @ApiResponse(responseCode = "404", description = "Filtro no encontrado",
                    content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<SavedEventFilterResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(filterService.getByIdForCurrentUser(id));
    }

    @Operation(summary = "Crear un nuevo filtro guardado para el usuario autenticado")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Filtro creado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos",
                    content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    })
    @PostMapping
    public ResponseEntity<SavedEventFilterResponseDTO> create(@Valid @RequestBody SavedEventFilterRequestDTO request) {
        SavedEventFilterResponseDTO created = filterService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Operation(summary = "Actualizar un filtro guardado existente")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Filtro actualizado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos",
                    content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
            @ApiResponse(responseCode = "404", description = "Filtro no encontrado",
                    content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    })
    @PutMapping("/{id}")
    public ResponseEntity<SavedEventFilterResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody SavedEventFilterRequestDTO request) {
        return ResponseEntity.ok(filterService.update(id, request));
    }

    @Operation(summary = "Eliminar un filtro guardado")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Filtro eliminado exitosamente"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Filtro no encontrado")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        filterService.delete(id);
        return ResponseEntity.noContent().build();
    }
}