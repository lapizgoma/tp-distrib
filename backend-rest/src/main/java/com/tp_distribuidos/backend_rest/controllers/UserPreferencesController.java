package com.tp_distribuidos.backend_rest.controllers;

import com.tp_distribuidos.backend_rest.dtos.UserPreferencesRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.UserPreferencesResponseDTO;
import com.tp_distribuidos.backend_rest.security.SecurityUser;
import com.tp_distribuidos.backend_rest.services.UserPreferencesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rest/users/me/preferences")
@RequiredArgsConstructor
@Tag(name = "Preferencias de usuario", description = "Consulta, actualización y borrado de las preferencias del usuario autenticado.")
@SecurityRequirement(name = "bearerAuth")
public class UserPreferencesController {

    private final UserPreferencesService preferenceService;

    @GetMapping
    @Operation(
            summary = "Obtener mis preferencias",
            description = "Devuelve los temas, técnicas y épocas favoritas del usuario autenticado. "
                    + "Si todavía no guardó preferencias, devuelve listas vacías.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Preferencias del usuario autenticado.",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = UserPreferencesResponseDTO.class))),
            @ApiResponse(
                    responseCode = "401",
                    description = "No autenticado: falta el token o es inválido.",
                    content = @Content(
                            mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    public ResponseEntity<UserPreferencesResponseDTO> getPreferences(
            @AuthenticationPrincipal SecurityUser user) {
        return ResponseEntity.ok(preferenceService.getForUser(user.getId()));
    }

    @PutMapping
    @Operation(
            summary = "Guardar mis preferencias",
            description = "Crea o reemplaza por completo las preferencias del usuario autenticado.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Preferencias guardadas correctamente.",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = UserPreferencesResponseDTO.class))),
            @ApiResponse(
                    responseCode = "400",
                    description = "Datos inválidos en la petición.",
                    content = @Content(
                            mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class))),
            @ApiResponse(
                    responseCode = "401",
                    description = "No autenticado: falta el token o es inválido.",
                    content = @Content(
                            mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    public ResponseEntity<UserPreferencesResponseDTO> updatePreferences(
            @AuthenticationPrincipal SecurityUser user,
            @Valid @RequestBody UserPreferencesRequestDTO request) {
        return ResponseEntity.ok(preferenceService.updateForUser(user.getId(), request));
    }

    @DeleteMapping
    @Operation(
            summary = "Borrar mis preferencias",
            description = "Elimina las preferencias del usuario autenticado. La operación es idempotente.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Preferencias eliminadas."),
            @ApiResponse(
                    responseCode = "401",
                    description = "No autenticado: falta el token o es inválido.",
                    content = @Content(
                            mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    public ResponseEntity<Void> deletePreferences(@AuthenticationPrincipal SecurityUser user) {
        preferenceService.deleteForUser(user.getId());
        return ResponseEntity.noContent().build();
    }
}
