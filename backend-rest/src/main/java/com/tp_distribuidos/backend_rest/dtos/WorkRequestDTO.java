package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.WorkAvailability;
import com.tp_distribuidos.backend_rest.enums.WorkEra;
import com.tp_distribuidos.backend_rest.enums.WorkLocation;
import com.tp_distribuidos.backend_rest.enums.WorkTechnique;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

@Schema(name = "WorkRequest", description = "Datos necesarios para crear o actualizar una obra.")
public record WorkRequestDTO(

        @Schema(description = "Título de la obra.", example = "La noche estrellada",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "El título es obligatorio")
        @Size(max = 255, message = "El título no puede superar los 255 caracteres")
        String title,

        @Schema(description = "Identificador del artista autor de la obra.", example = "1",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull(message = "El artista es obligatorio")
        @Positive(message = "El id del artista debe ser positivo")
        Long artistId,

        @Schema(description = "URL de la imagen de la obra.",
                example = "https://museo.org/obras/noche-estrellada.jpg",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "La URL de la imagen es obligatoria")
        @Size(max = 500, message = "La URL de la imagen no puede superar los 500 caracteres")
        String imageUrl,

        @Schema(description = "Año de creación de la obra.", example = "1889")
        @Positive(message = "El año de creación debe ser positivo")
        Integer creationYear,

        @Schema(description = "Técnica utilizada.", example = "OLEO")
        WorkTechnique technique,

        @Schema(description = "Dimensiones de la obra.", example = "73.7 cm × 92.1 cm")
        @Size(max = 100, message = "Las dimensiones no pueden superar los 100 caracteres")
        String dimensions,

        @Schema(description = "Época o período artístico.", example = "IMPRESIONISMO")
        WorkEra era,

        @Schema(description = "Descripción de la obra.", example = "Representa la vista nocturna...")
        String description,

        @Schema(description = "Ubicación en el museo.", example = "SALA_4_ARTE_MODERNO")
        WorkLocation location,

        @Schema(description = "Disponibilidad de la obra.", example = "EN_EXHIBICION",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull(message = "La disponibilidad es obligatoria")
        WorkAvailability availability
) {
}
