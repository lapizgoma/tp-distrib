package com.tp_distribuidos.backend_rest.controllers;

import com.tp_distribuidos.backend_rest.dtos.LoginRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.LoginResponseDTO;
import com.tp_distribuidos.backend_rest.dtos.RegisterRequestDTO;
import com.tp_distribuidos.backend_rest.services.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rest/auth")
@Tag(name = "Autenticación", description = "Registro y login de usuarios.")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "Registrar un nuevo usuario",
            description = "Endpoint público que crea un usuario con rol VISITANTE. No emite token: "
                    + "ante un registro exitoso responde únicamente 201 Created sin cuerpo.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Usuario creado correctamente."),
            @ApiResponse(
                    responseCode = "400",
                    description = "Datos inválidos o la contraseña y su confirmación no coinciden.",
                    content = @Content(
                            mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class))),
            @ApiResponse(
                    responseCode = "409",
                    description = "Ya existe un usuario registrado con ese email.",
                    content = @Content(
                            mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    public void register(@Valid @RequestBody RegisterRequestDTO request) {
        authService.register(request);
    }

    @PostMapping("/login")
    @Operation(
            summary = "Iniciar sesión",
            description = "Endpoint público que valida las credenciales y devuelve un token JWT "
                    + "para autenticar las siguientes peticiones mediante el header Authorization: Bearer <token>.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Autenticación exitosa.",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = LoginResponseDTO.class))),
            @ApiResponse(
                    responseCode = "400",
                    description = "Datos inválidos en la petición.",
                    content = @Content(
                            mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class))),
            @ApiResponse(
                    responseCode = "401",
                    description = "Credenciales inválidas.",
                    content = @Content(
                            mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    public LoginResponseDTO login(@Valid @RequestBody LoginRequestDTO request) {
        return authService.login(request);
    }
}
