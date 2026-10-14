package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.models.entities.SavedEventFilter;
import io.swagger.v3.oas.annotations.media.Schema;

public record SavedEventFilterResponseDTO(

        @Schema(example = "1", description = "Identificador único del filtro guardado")
        Long id,

        @Schema(example = "10", description = "ID del usuario propietario del filtro")
        Long userId,

        @Schema(example = "Talleres fin de semana")
        String name,

        @Schema(example = "Filtro para talleres y charlas del curador 1")
        String description,

        EventFilterConfigDTO filterConfig
) {

    public static SavedEventFilterResponseDTO fromEntity(SavedEventFilter filter) {
        return new SavedEventFilterResponseDTO(
                filter.getId(),
                filter.getUser().getId(),
                filter.getName(),
                filter.getDescription(),
                filter.getFilterConfig());
    }
}
