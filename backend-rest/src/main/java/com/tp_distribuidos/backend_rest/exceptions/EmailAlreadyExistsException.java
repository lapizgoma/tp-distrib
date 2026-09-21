package com.tp_distribuidos.backend_rest.exceptions;

/**
 * Excepción lanzada cuando se intenta registrar un usuario con un email que
 * ya existe en la base de datos.
 *
 * <p>El {@code GlobalExceptionHandler} la traduce a una respuesta HTTP
 * {@code 409 Conflict} con un {@code ProblemDetail}.</p>
 */
public class EmailAlreadyExistsException extends RuntimeException {

    /**
     * Crea la excepción indicando el email que ya se encuentra registrado.
     *
     * @param email email duplicado.
     */
    public EmailAlreadyExistsException(String email) {
        super("Ya existe un usuario registrado con el email: " + email);
    }
}
