package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.WorkAvailability;
import com.tp_distribuidos.backend_rest.enums.WorkEra;
import com.tp_distribuidos.backend_rest.enums.WorkLocation;
import com.tp_distribuidos.backend_rest.enums.WorkTechnique;
import com.tp_distribuidos.backend_rest.models.entities.Work;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Detalle completo de una obra de arte")
public record WorkDetailDTO(

        @Schema(description = "Identificador único de la obra", example = "1")
        Long id,

        @Schema(description = "Título de la obra", example = "La noche estrellada")
        String title,

        @Schema(description = "URL de la imagen", example = "https://museo.org/obras/noche-estrellada.jpg")
        String imageUrl,

        @Schema(description = "Año de creación", example = "1889")
        Integer creationYear,

        @Schema(description = "Técnica utilizada", example = "OLEO")
        WorkTechnique technique,

        @Schema(description = "Dimensiones de la obra", example = "73.7 cm × 92.1 cm")
        String dimensions,

        @Schema(description = "Época o período artístico", example = "IMPRESIONISMO")
        WorkEra era,

        @Schema(description = "Descripción de la obra", example = "Representa la vista nocturna...")
        String description,

        @Schema(description = "Ubicación en el museo", example = "SALA_4_ARTE_MODERNO")
        WorkLocation location,

        @Schema(description = "Disponibilidad de la obra", example = "EN_EXHIBICION")
        WorkAvailability availability,

        @Schema(description = "Información del artista")
        ArtistSummaryDTO artist
) {

    public static WorkDetailDTO fromEntity(Work work) {
        ArtistSummaryDTO artistDto = null;
        if (work.getArtist() != null) {
            artistDto = new ArtistSummaryDTO(
                    work.getArtist().getId(),
                    work.getArtist().getName(),
                    work.getArtist().getBiography());
        }

        return new WorkDetailDTO(
                work.getId(),
                work.getTitle(),
                work.getImageUrl(),
                work.getCreationYear(),
                work.getTechnique(),
                work.getDimensions(),
                work.getEra(),
                work.getDescription(),
                work.getLocation(),
                work.getAvailability(),
                artistDto);
    }

    @Schema(description = "Resumen del artista")
    public record ArtistSummaryDTO(
            Long id,
            String name,
            String biography
    ) {
    }
}
