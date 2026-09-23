package com.tp_distribuidos.backend_rest.exceptions;

/**
 * Excepción lanzada cuando se referencia un artista que no existe al crear o
 * actualizar una obra.
 *
 * <p>El {@code GlobalExceptionHandler} la traduce a una respuesta HTTP
 * {@code 404 Not Found} con un {@code ProblemDetail}.</p>
 */
public class ArtistNotFoundException extends RuntimeException {

    /**
     * Crea la excepción indicando el identificador buscado.
     *
     * @param id identificador del artista no encontrado.
     */
    public ArtistNotFoundException(Long id) {
        super("Artista no encontrado con id: " + id);
    }
}
