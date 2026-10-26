package com.tp_distribuidos.backend_rest.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Temas de obra disponibles para las preferencias del usuario.
 *
 * <p>Los valores JSON coinciden con los temas almacenados en la columna
 * {@code works.topics} y en las preferencias de ejemplo, por lo que se usa
 * {@link JsonValue} para serializar el label legible y {@link JsonCreator}
 * para aceptar tanto el label como el nombre del enum.</p>
 */
public enum WorkTopic {
    NATURALEZA("Naturaleza"),
    RETRATO("Retrato"),
    PAISAJE("Paisaje"),
    NOCTURNO("Nocturno"),
    BODEGON("Bodegón"),
    FLORES("Flores"),
    VIDA_COTIDIANA("Vida cotidiana"),
    INTERIOR("Interior"),
    MAR("Mar"),
    AGUA("Agua"),
    RENACIMIENTO("Renacimiento"),
    RELIGION("Religión"),
    HISTORIA("Historia"),
    IDENTIDAD("Identidad"),
    SIMBOLISMO("Simbolismo"),
    DOLOR("Dolor"),
    GUERRA("Guerra"),
    POLITICA("Política"),
    AMOR("Amor"),
    MODERNISMO("Modernismo"),
    BARROCO("Barroco"),
    SURREALISMO("Surrealismo"),
    TIEMPO("Tiempo"),
    SUENOS("Sueños"),
    JARDIN("Jardín");

    private final String label;

    WorkTopic(String label) {
        this.label = label;
    }

    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator
    public static WorkTopic fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        for (WorkTopic topic : values()) {
            if (topic.label.equalsIgnoreCase(value) || topic.name().equalsIgnoreCase(value)) {
                return topic;
            }
        }

        throw new IllegalArgumentException("Tema de preferencia desconocido: " + value);
    }
}
