package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.WorkEra;
import com.tp_distribuidos.backend_rest.enums.WorkTechnique;
import com.tp_distribuidos.backend_rest.enums.WorkTopic;
import com.tp_distribuidos.backend_rest.models.entities.UserPreference;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(name = "UserPreferencesResponse", description = "Preferencias del usuario autenticado.")
public record UserPreferencesResponseDTO(

        @Schema(description = "Identificador del usuario.", example = "1")
        Long userId,

        @Schema(description = "Temas favoritos del usuario.")
        List<WorkTopic> favoriteTopics,

        @Schema(description = "Técnicas favoritas del usuario.")
        List<WorkTechnique> favoriteTechniques,

        @Schema(description = "Épocas favoritas del usuario.")
        List<WorkEra> favoriteEras
) {

    public static UserPreferencesResponseDTO empty(Long userId) {
        return new UserPreferencesResponseDTO(userId, List.of(), List.of(), List.of());
    }

    public static UserPreferencesResponseDTO fromEntity(UserPreference preference) {
        return new UserPreferencesResponseDTO(
                preference.getUserId(),
                safeList(preference.getFavoriteTopics()),
                safeList(preference.getFavoriteTechniques()),
                safeList(preference.getFavoriteEras()));
    }

    private static <T> List<T> safeList(List<T> values) {
        return values == null ? List.of() : List.copyOf(values);
    }
}
