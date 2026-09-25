package com.tp_distribuidos.backend_rest.exceptions;

/**
 * Excepción lanzada cuando ocurre una infracción en las reglas de negocio
 * vinculadas a la inscripción de un usuario a un evento (por ejemplo, usuario
 * ya inscripto o cupo máximo alcanzado).
 *
 * <p>El {@code GlobalExceptionHandler} la traduce a una respuesta HTTP
 * {@code 400 Bad Request} con un {@code ProblemDetail}.</p>
 */
public class EventRegistrationException extends RuntimeException {

    /**
     * Crea la excepción indicando el motivo de la infracción de negocio.
     *
     * @param message mensaje explicativo del error.
     */
    public EventRegistrationException(String message) {
        super(message);
    }
}