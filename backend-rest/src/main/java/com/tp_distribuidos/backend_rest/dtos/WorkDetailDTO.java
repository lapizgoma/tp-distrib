package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.WorkAvailability;
import com.tp_distribuidos.backend_rest.enums.WorkEra;
import com.tp_distribuidos.backend_rest.enums.WorkLocation;
import com.tp_distribuidos.backend_rest.enums.WorkTechnique;
import com.tp_distribuidos.backend_rest.models.entities.Work;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "Detalle completo de una obra de arte")
public class WorkDetailDTO {

    @Schema(description = "Identificador único de la obra", example = "1")
    private Long id;

    @Schema(description = "Título de la obra", example = "La noche estrellada")
    private String title;

    @Schema(description = "URL de la imagen", example = "https://museo.org/obras/noche-estrellada.jpg")
    private String imageUrl;

    @Schema(description = "Año de creación", example = "1889")
    private Integer creationYear;

    @Schema(description = "Técnica utilizada", example = "OLEO")
    private WorkTechnique technique;

    @Schema(description = "Dimensiones de la obra", example = "73.7 cm × 92.1 cm")
    private String dimensions;

    @Schema(description = "Época o período artístico", example = "IMPRESIONISMO")
    private WorkEra era;

    @Schema(description = "Descripción de la obra", example = "Representa la vista nocturna...")
    private String description;

    @Schema(description = "Ubicación en el museo", example = "SALA_4_ARTE_MODERNO")
    private WorkLocation location;

    @Schema(description = "Disponibilidad de la obra", example = "EN_EXHIBICION")
    private WorkAvailability availability;

    @Schema(description = "Información del artista")
    private ArtistSummaryDTO artist;

    public static WorkDetailDTO fromEntity(Work work) {
        ArtistSummaryDTO artistDto = null;
        if (work.getArtist() != null) {
            artistDto = ArtistSummaryDTO.builder()
                    .id(work.getArtist().getId())
                    .name(work.getArtist().getName())
                    .biography(work.getArtist().getBiography())
                    .build();
        }

        return WorkDetailDTO.builder()
                .id(work.getId())
                .title(work.getTitle())
                .imageUrl(work.getImageUrl())
                .creationYear(work.getCreationYear())
                .technique(work.getTechnique())
                .dimensions(work.getDimensions())
                .era(work.getEra())
                .description(work.getDescription())
                .location(work.getLocation())
                .availability(work.getAvailability())
                .artist(artistDto)
                .build();
    }

    @Getter
    @Builder
    @Schema(description = "Resumen del artista")
    public static class ArtistSummaryDTO {
        private Long id;
        private String name;
        private String biography;
    }
}