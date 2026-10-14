package com.tp_distribuidos.backend_rest.exceptions;

import org.springframework.http.HttpStatus;

/**
 * Excepción base de la API que asocia un mensaje a un estado HTTP.
 *
 * <p>Las excepciones de negocio heredan de esta clase para transportar el
 * {@link HttpStatus} con el que deben responder. El
 * {@code GlobalExceptionHandler} las traduce a un {@code ProblemDetail} usando
 * ese estado y el mensaje, de modo que el cliente siempre recibe el detalle
 * real del error y no la página de error por defecto de Spring.</p>
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    /**
     * Crea la excepción indicando el estado HTTP y el mensaje del error.
     *
     * @param status  estado HTTP con el que se responderá.
     * @param message mensaje explicativo del error.
     */
    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    /**
     * @return el estado HTTP asociado a la excepción.
     */
    public HttpStatus getStatus() {
        return status;
    }
}
