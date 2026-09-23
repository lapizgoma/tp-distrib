package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.models.entities.Work;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Resumen de una obra para listados.")
public record WorkSummaryDTO(

        @Schema(description = "Identificador único de la obra.", example = "1")
        Long id,

        @Schema(description = "Título de la obra.", example = "La noche estrellada")
        String title,

        @Schema(description = "URL de la imagen.", example = "https://museo.org/obras/noche-estrellada.jpg")
        String imageUrl,

        @Schema(description = "Año de creación.", example = "1889")
        Integer creationYear,

        @Schema(description = "Descripción truncada a 150 caracteres.",
                example = "Representa la vista nocturna...")
        String description
) {

    private static final int DESCRIPTION_MAX_LENGTH = 150;

    /**
     * Construye el resumen a partir de la entidad, truncando la descripción si
     * supera el máximo permitido.
     *
     * @param work obra a resumir.
     * @return el resumen de la obra listo para serializar.
     */
    public static WorkSummaryDTO fromEntity(Work work) {
        return new WorkSummaryDTO(
                work.getId(),
                work.getTitle(),
                work.getImageUrl(),
                work.getCreationYear(),
                truncateDescription(work.getDescription()));
    }

    private static String truncateDescription(String description) {
        if (description == null || description.length() <= DESCRIPTION_MAX_LENGTH) {
            return description;
        }
        return description.substring(0, DESCRIPTION_MAX_LENGTH) + "…";
    }
}
