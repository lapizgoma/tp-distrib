package com.tp_distribuidos.backend_rest.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
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
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Maneja el intento de registrar un email ya existente.
     *
     * @param ex excepción lanzada por la capa de servicio.
     * @return un {@link ProblemDetail} con estado {@code 409 Conflict}.
     */
    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ProblemDetail handleEmailAlreadyExists(EmailAlreadyExistsException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }

    /**
     * Maneja la validación de contraseña y confirmación fallida.
     *
     * @param ex excepción lanzada por la capa de servicio.
     * @return un {@link ProblemDetail} con estado {@code 400 Bad Request}.
     */
    @ExceptionHandler(PasswordsDoNotMatchException.class)
    public ProblemDetail handlePasswordsDoNotMatch(PasswordsDoNotMatchException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /**
     * Maneja la búsqueda de una obra inexistente.
     *
     * @param ex excepción lanzada por la capa de servicio.
     * @return un {@link ProblemDetail} con estado {@code 404 Not Found}.
     */
    @ExceptionHandler(WorkNotFoundException.class)
    public ProblemDetail handleWorkNotFound(WorkNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    /**
     * Maneja la referencia a un artista inexistente al crear o actualizar una
     * obra.
     *
     * @param ex excepción lanzada por la capa de servicio.
     * @return un {@link ProblemDetail} con estado {@code 404 Not Found}.
     */
    @ExceptionHandler(ArtistNotFoundException.class)
    public ProblemDetail handleArtistNotFound(ArtistNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
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
}
