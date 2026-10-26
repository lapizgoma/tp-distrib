package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.WorkEra;
import com.tp_distribuidos.backend_rest.enums.WorkTechnique;
import com.tp_distribuidos.backend_rest.enums.WorkTopic;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.util.List;

@Schema(name = "UserPreferencesRequest", description = "Preferencias del usuario autenticado.")
public record UserPreferencesRequestDTO(

        @NotNull(message = "La lista de temas favoritos es obligatoria")
        @Schema(description = "Temas favoritos del usuario.")
        List<WorkTopic> favoriteTopics,

        @NotNull(message = "La lista de técnicas favoritas es obligatoria")
        @Schema(description = "Técnicas favoritas del usuario.")
        List<WorkTechnique> favoriteTechniques,

        @NotNull(message = "La lista de épocas favoritas es obligatoria")
        @Schema(description = "Épocas favoritas del usuario.")
        List<WorkEra> favoriteEras
) {
}
