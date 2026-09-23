package com.tp_distribuidos.backend_rest.exceptions;

/**
 * Excepción lanzada cuando se busca, actualiza o elimina una obra que no
 * existe en la base de datos.
 *
 * <p>El {@code GlobalExceptionHandler} la traduce a una respuesta HTTP
 * {@code 404 Not Found} con un {@code ProblemDetail}.</p>
 */
public class WorkNotFoundException extends RuntimeException {

    /**
     * Crea la excepción indicando el identificador buscado.
     *
     * @param id identificador de la obra no encontrada.
     */
    public WorkNotFoundException(Long id) {
        super("Obra no encontrada con id: " + id);
    }
}
