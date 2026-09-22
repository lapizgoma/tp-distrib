package com.tp_distribuidos.backend_rest.exceptions;

/**
 * Excepción lanzada cuando la contraseña y su confirmación no coinciden
 * durante el registro de un usuario.
 *
 * <p>El {@code GlobalExceptionHandler} la traduce a una respuesta HTTP
 * {@code 400 Bad Request} con un {@code ProblemDetail}.</p>
 */
public class PasswordsDoNotMatchException extends RuntimeException {

    /**
     * Crea la excepción con un mensaje descriptivo del error.
     */
    public PasswordsDoNotMatchException() {
        super("La contraseña y su confirmación no coinciden");
    }
}
