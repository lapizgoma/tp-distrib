package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.models.entities.SavedEventFilter;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SavedEventFilterResponseDTO {

    @Schema(example = "1", description = "Identificador único del filtro guardado")
    private Long id;

    @Schema(example = "10", description = "ID del usuario propietario del filtro")
    private Long userId;

    @Schema(example = "Talleres fin de semana")
    private String name;

    @Schema(example = "Filtro para talleres y charlas del curador 1")
    private String description;

    private EventFilterConfigDTO filterConfig;

    public static SavedEventFilterResponseDTO fromEntity(SavedEventFilter filter) {
        return SavedEventFilterResponseDTO.builder()
                .id(filter.getId())
                .userId(filter.getUser().getId())
                .name(filter.getName())
                .description(filter.getDescription())
                .filterConfig(filter.getFilterConfig())
                .build();
    }
}