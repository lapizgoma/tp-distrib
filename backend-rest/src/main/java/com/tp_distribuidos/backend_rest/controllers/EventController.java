package com.tp_distribuidos.backend_rest.controllers;

import com.tp_distribuidos.backend_rest.dtos.EventFilterRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.EventRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.EventResponseDTO;
import com.tp_distribuidos.backend_rest.services.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rest/events")
@RequiredArgsConstructor
@Tag(name = "Eventos", description = "Endpoints de consulta y gestión de eventos del museo")
public class EventController {

    private final EventService eventService;

    @GetMapping
    @Operation(summary = "Listar eventos",
            description = "Retorna todos los eventos (futuros y pasados), con filtros opcionales por fecha, tipo de evento o curador a cargo.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista recuperada exitosamente"),
            @ApiResponse(responseCode = "400", description = "Rango de fechas inválido")
    })
    public ResponseEntity<List<EventResponseDTO>> getAllEvents(
            @ParameterObject @ModelAttribute EventFilterRequestDTO filter) {
        return ResponseEntity.ok(eventService.getAllEvents(filter));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener detalle de un evento", description = "Retorna la información completa de un evento por ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Evento encontrado"),
            @ApiResponse(responseCode = "404", description = "Evento no encontrado")
    })
    public ResponseEntity<EventResponseDTO> getEventById(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CURADOR', 'ADMINISTRADOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Crear un evento", description = "Permite a un curador o administrador programar un nuevo evento.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Evento creado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "No autorizado para crear eventos"),
            @ApiResponse(responseCode = "404", description = "Curador no encontrado")
    })
    public ResponseEntity<EventResponseDTO> createEvent(@Valid @RequestBody EventRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createEvent(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CURADOR', 'ADMINISTRADOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Actualizar un evento", description = "Permite a un curador o administrador modificar los datos de un evento existente.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Evento modificado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "No autorizado para modificar eventos"),
            @ApiResponse(responseCode = "404", description = "Evento o curador no encontrado")
    })
    public ResponseEntity<EventResponseDTO> updateEvent(@PathVariable Long id, @Valid @RequestBody EventRequestDTO dto) {
        return ResponseEntity.ok(eventService.updateEvent(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CURADOR', 'ADMINISTRADOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Eliminar un evento", description = "Permite a un curador o administrador eliminar un evento.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Evento eliminado exitosamente"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "No autorizado para eliminar eventos"),
            @ApiResponse(responseCode = "404", description = "Evento no encontrado")
    })
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }
}