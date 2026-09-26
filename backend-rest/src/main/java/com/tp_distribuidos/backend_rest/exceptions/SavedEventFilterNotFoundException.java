package com.tp_distribuidos.backend_rest.exceptions;

/**
 * Excepción lanzada cuando se busca, actualiza o elimina un filtro de eventos
 * guardado que no existe en la base de datos o que no pertenece al usuario autenticado.
 *
 * <p>El {@code GlobalExceptionHandler} la traduce a una respuesta HTTP
 * {@code 404 Not Found} con un {@code ProblemDetail}.</p>
 */
public class SavedEventFilterNotFoundException extends RuntimeException {

    /**
     * Crea la excepción indicando el motivo o identificador del error.
     *
     * @param message mensaje explicativo del recurso no encontrado.
     */
    public SavedEventFilterNotFoundException(String message) {
        super(message);
    }
}