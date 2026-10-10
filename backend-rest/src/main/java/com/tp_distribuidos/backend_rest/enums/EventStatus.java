package com.tp_distribuidos.backend_rest.enums;

/**
 * Estado temporal de un evento respecto al momento actual, usado para filtrar
 * el informe de asistencia.
 *
 * <p>Alineado con el enum {@code EventStatus} del microservicio GraphQL:</p>
 * <ul>
 *     <li>{@link #ENDED}: eventos cuyo {@code datetime + duration} ya pasó.</li>
 *     <li>{@link #UPCOMING}: eventos cuyo {@code datetime} todavía no llegó.</li>
 *     <li>{@link #ALL}: no filtra por estado (valor por defecto).</li>
 * </ul>
 */
public enum EventStatus {
    ENDED,
    UPCOMING,
    ALL
}
