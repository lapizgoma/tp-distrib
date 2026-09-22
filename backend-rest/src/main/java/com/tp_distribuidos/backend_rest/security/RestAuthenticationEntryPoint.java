package com.tp_distribuidos.backend_rest.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

/**
 * Punto de entrada para peticiones no autenticadas.
 *
 * <p>Se invoca cuando una ruta protegida es accedida sin token válido. Responde
 * {@code 401 Unauthorized} con un {@link ProblemDetail}, manteniendo el mismo
 * formato de error que el {@code GlobalExceptionHandler}. Es necesario porque
 * los errores originados en la cadena de filtros no pasan por
 * {@code @RestControllerAdvice}.</p>
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    /**
     * Crea el punto de entrada con el serializador JSON.
     *
     * @param objectMapper serializador usado para escribir el {@link ProblemDetail}.
     */
    public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Escribe la respuesta {@code 401} en formato {@code application/problem+json}.
     *
     * @param request       petición que originó el rechazo.
     * @param response      respuesta HTTP a completar.
     * @param authException excepción de autenticación asociada.
     * @throws IOException si falla la escritura de la respuesta.
     */
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNAUTHORIZED,
                "No autenticado: se requiere un token de acceso válido");

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), problemDetail);
    }
}
