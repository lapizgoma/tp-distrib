package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.WorkAvailability;
import com.tp_distribuidos.backend_rest.enums.WorkEra;
import com.tp_distribuidos.backend_rest.enums.WorkLocation;
import com.tp_distribuidos.backend_rest.enums.WorkTechnique;
import com.tp_distribuidos.backend_rest.models.entities.Work;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class WorkSummaryDTOTest {

    private static final Long WORK_ID = 10L;

    @Test
    void mapsCoreFieldsFromEntity() {
        Work work = buildWork("Una descripcion corta.");

        WorkSummaryDTO dto = WorkSummaryDTO.fromEntity(work);

        assertThat(dto.id()).isEqualTo(WORK_ID);
        assertThat(dto.title()).isEqualTo("La noche estrellada");
        assertThat(dto.imageUrl()).isEqualTo("https://museo.org/obras/noche-estrellada.jpg");
        assertThat(dto.creationYear()).isEqualTo(1889);
    }

    @Test
    void keepsNullDescriptionAsNull() {
        WorkSummaryDTO dto = WorkSummaryDTO.fromEntity(buildWork(null));

        assertThat(dto.description()).isNull();
    }

    @Test
    void keepsShortDescriptionUnchanged() {
        String description = "Una descripcion corta.";

        WorkSummaryDTO dto = WorkSummaryDTO.fromEntity(buildWork(description));

        assertThat(dto.description()).isEqualTo(description);
    }

    @Test
    void keepsDescriptionOfExactlyMaxLengthUnchanged() {
        String description = "a".repeat(150);

        WorkSummaryDTO dto = WorkSummaryDTO.fromEntity(buildWork(description));

        assertThat(dto.description()).isEqualTo(description);
        assertThat(dto.description()).hasSize(150);
    }

    @Test
    void truncatesDescriptionLongerThanMaxLengthAndAppendsEllipsis() {
        String description = "a".repeat(151);

        WorkSummaryDTO dto = WorkSummaryDTO.fromEntity(buildWork(description));

        assertThat(dto.description()).isEqualTo("a".repeat(150) + "…");
        assertThat(dto.description()).hasSize(151);
    }

    private Work buildWork(String description) {
        Work work = Work.of(
                "La noche estrellada",
                null,
                "https://museo.org/obras/noche-estrellada.jpg",
                1889,
                WorkTechnique.OLEO,
                "73.7 cm x 92.1 cm",
                WorkEra.IMPRESIONISMO,
                description,
                WorkLocation.SALA_4_ARTE_MODERNO,
                WorkAvailability.EN_EXHIBICION);
        ReflectionTestUtils.setField(work, "id", WORK_ID);
        return work;
    }
}
