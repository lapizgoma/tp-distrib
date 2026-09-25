package com.tp_distribuidos.backend_rest.controllers;

import com.tp_distribuidos.backend_rest.dtos.EventRegistrationRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.EventRegistrationResponseDTO;
import com.tp_distribuidos.backend_rest.services.EventRegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rest/events/members")
@RequiredArgsConstructor
@Tag(name = "Inscripciones a Eventos", description = "Endpoints para la inscripción y desinscripción de usuarios a eventos")
public class EventMemberController {

    private final EventRegistrationService registrationService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Inscribirse a un evento", description = "Inscribe al usuario autenticado al evento especificado controlando el cupo disponible.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Inscripción registrada con éxito"),
            @ApiResponse(responseCode = "400", description = "Cupo alcanzado o usuario ya inscripto"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Evento no encontrado")
    })
    public ResponseEntity<EventRegistrationResponseDTO> registerMember(@Valid @RequestBody EventRegistrationRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(registrationService.registerMember(request));
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Cancelar inscripción", description = "Elimina la inscripción del usuario autenticado al evento.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Inscripción cancelada exitosamente"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Inscripción o evento no encontrado")
    })
    public ResponseEntity<Void> unregisterMember(@Valid @RequestBody EventRegistrationRequestDTO request) {
        registrationService.unregisterMember(request);
        return ResponseEntity.noContent().build();
    }
}