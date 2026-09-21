package com.tp_distribuidos.backend_rest.controllers;

import com.tp_distribuidos.backend_rest.dtos.RegisterRequestDTO;
import com.tp_distribuidos.backend_rest.services.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador REST de autenticación.
 *
 * <p>Expone los endpoints públicos de registro (y, a futuro, de login).</p>
 */
@RestController
@RequestMapping("/api/rest/auth")
public class AuthController {

    private final AuthService authService;

    /**
     * Crea el controlador con el servicio de autenticación.
     *
     * @param authService servicio con la lógica de registro.
     */
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Registra un nuevo usuario en el sistema.
     *
     * <p>Endpoint público. Ante un registro exitoso responde únicamente con
     * {@code 201 Created} y sin cuerpo; no devuelve token. Los errores de
     * validación o de negocio son traducidos por el
     * {@code GlobalExceptionHandler} a respuestas {@code ProblemDetail}.</p>
     *
     * @param request datos del formulario de registro.
     */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void register(@Valid @RequestBody RegisterRequestDTO request) {
        authService.register(request);
    }
}
