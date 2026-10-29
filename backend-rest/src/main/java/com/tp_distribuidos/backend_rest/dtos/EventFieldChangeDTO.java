package com.tp_distribuidos.backend_rest.dtos;

/**
 * Valor anterior y posterior de un campo modificado.
 *
 * <p>Los valores conservan su tipo JSON original: texto, número, enum o
 * {@code null}. El nombre del campo se usa como clave del mapa {@code changes}
 * en el mensaje de Kafka.</p>
 */
public record EventFieldChangeDTO(
        Object previous,
        Object current
) {
}
