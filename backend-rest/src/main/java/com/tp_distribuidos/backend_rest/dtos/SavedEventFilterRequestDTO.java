package com.tp_distribuidos.backend_rest.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SavedEventFilterRequestDTO {

    @NotBlank(message = "El nombre del filtro es obligatorio")
    @Size(max = 255, message = "El nombre no puede superar los 255 caracteres")
    @Schema(example = "Talleres fin de semana", description = "Nombre identificatorio del filtro guardado")
    private String name;

    @Schema(example = "Filtro para talleres y charlas del curador 1", description = "Descripción opcional del filtro")
    private String description;

    @NotNull(message = "La configuración del filtro es obligatoria")
    @Valid
    @Schema(description = "Criterios de búsqueda asociados a este filtro")
    private EventFilterConfigDTO filterConfig;
}