package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.WorkEra;
import com.tp_distribuidos.backend_rest.enums.WorkLocation;
import com.tp_distribuidos.backend_rest.enums.WorkTechnique;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Arrays;
import java.util.List;

@Schema(description = "Valores disponibles para filtrar obras por era, técnica y ubicación.")
public record WorkFiltersDTO(

        @Schema(description = "Épocas o períodos artísticos disponibles.",
                example = "[\"RENACIMIENTO\", \"BARROCO\", \"IMPRESIONISMO\"]")
        List<String> eras,

        @Schema(description = "Técnicas disponibles.",
                example = "[\"OLEO\", \"ACRILICO\", \"ESCULTURA\"]")
        List<String> techniques,

        @Schema(description = "Ubicaciones disponibles.",
                example = "[\"SALA_1_GRANDES_MAESTROS\", \"DEPOSITO\"]")
        List<String> locations
) {

    public static WorkFiltersDTO fromEnums() {
        return new WorkFiltersDTO(
                Arrays.stream(WorkEra.values()).map(Enum::name).toList(),
                Arrays.stream(WorkTechnique.values()).map(Enum::name).toList(),
                Arrays.stream(WorkLocation.values()).map(Enum::name).toList());
    }
}
