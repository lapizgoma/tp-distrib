package com.tp_distribuidos.backend_rest.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Manejador global de excepciones para todos los controladores REST.
 *
 * <p>Centraliza la traducción de excepciones a respuestas HTTP siguiendo el
 * estándar RFC 7807 ({@link ProblemDetail}), devolviéndolo directamente para
 * que Spring lo serialice con el content type {@code application/problem+json}.</p>
 *
 * <p>Todas las excepciones de negocio heredan de {@link ApiException}, por lo
 * que un único manejador las resuelve conservando el estado HTTP y el mensaje.
 * El manejador genérico garantiza que cualquier error no contemplado también
 * responda como {@code ProblemDetail}.</p>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Maneja todas las excepciones de negocio derivadas de {@link ApiException},
     * preservando el estado HTTP y el mensaje definidos en la excepción.
     *
     * @param ex excepción lanzada por la capa de servicio.
     * @return un {@link ProblemDetail} con el estado y el detalle del error.
     */
    @ExceptionHandler(ApiException.class)
    public ProblemDetail handleApiException(ApiException ex) {
        return ProblemDetail.forStatusAndDetail(ex.getStatus(), ex.getMessage());
    }

    /**
     * Maneja las credenciales inválidas durante el login.
     *
     * <p>Devuelve un mensaje genérico para no revelar si el email existe o no en
     * el sistema, evitando la enumeración de usuarios.</p>
     *
     * @param ex excepción lanzada por el {@code AuthenticationManager}.
     * @return un {@link ProblemDetail} con estado {@code 401 Unauthorized}.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthenticationException(AuthenticationException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Credenciales inválidas");
    }

    /**
     * Maneja los errores de Bean Validation producidos por {@code @Valid} sobre
     * el cuerpo de la petición.
     *
     * <p>Agrega en la propiedad {@code errors} un mapa con el nombre de cada
     * campo inválido y su mensaje, para dar detalle al cliente.</p>
     *
     * @param ex excepción con los resultados de la validación.
     * @return un {@link ProblemDetail} con estado {@code 400 Bad Request}.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "La petición contiene datos inválidos");

        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        problemDetail.setProperty("errors", errors);

        return problemDetail;
    }

    /**
     * Maneja los conflictos de integridad de datos (por ejemplo, un filtro
     * guardado con un nombre ya existente para el mismo usuario).
     *
     * @param ex excepción de integridad lanzada por el repositorio.
     * @return un {@link ProblemDetail} con estado {@code 409 Conflict}.
     */
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException ex) {
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                "Ya tienes un filtro guardado con ese nombre o los datos entran en conflicto.");
    }

    /**
     * Manejador de último recurso para cualquier excepción no contemplada.
     *
     * <p>Si la excepción ya es un {@link ErrorResponse} de Spring (por ejemplo,
     * {@code NoResourceFoundException} o {@code HttpRequestMethodNotSupportedException}),
     * se respeta su estado HTTP y su detalle. En caso contrario, se responde
     * {@code 500 Internal Server Error} con un mensaje genérico.</p>
     *
     * @param ex excepción no manejada específicamente.
     * @return un {@link ProblemDetail} con el estado y el detalle correspondientes.
     */
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneric(Exception ex) {
        if (ex instanceof ErrorResponse errorResponse) {
            String detail = errorResponse.getBody().getDetail();
            if (detail == null || detail.isBlank()) {
                detail = errorResponse.getStatusCode().toString();
            }
            return ProblemDetail.forStatusAndDetail(errorResponse.getStatusCode(), detail);
        }

        return ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Ocurrió un error inesperado en el servidor");
    }
}
