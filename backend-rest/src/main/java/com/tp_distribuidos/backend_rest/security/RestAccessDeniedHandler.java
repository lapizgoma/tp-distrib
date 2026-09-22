package com.tp_distribuidos.backend_rest.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

/**
 * Manejador para peticiones autenticadas pero sin permisos suficientes.
 *
 * <p>Se invoca cuando un usuario autenticado intenta acceder a un recurso para
 * el que no tiene autorización. Responde {@code 403 Forbidden} con un
 * {@link ProblemDetail}, manteniendo el mismo formato de error que el
 * {@code GlobalExceptionHandler}.</p>
 */
@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    /**
     * Crea el manejador con el serializador JSON.
     *
     * @param objectMapper serializador usado para escribir el {@link ProblemDetail}.
     */
    public RestAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Escribe la respuesta {@code 403} en formato {@code application/problem+json}.
     *
     * @param request               petición que originó el rechazo.
     * @param response              respuesta HTTP a completar.
     * @param accessDeniedException excepción de acceso denegado asociada.
     * @throws IOException si falla la escritura de la respuesta.
     */
    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.FORBIDDEN,
                "Acceso denegado: no tiene permisos para realizar esta operación");

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), problemDetail);
    }
}
