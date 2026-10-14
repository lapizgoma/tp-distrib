package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.WorkAvailability;
import com.tp_distribuidos.backend_rest.enums.WorkEra;
import com.tp_distribuidos.backend_rest.enums.WorkLocation;
import com.tp_distribuidos.backend_rest.enums.WorkTechnique;
import com.tp_distribuidos.backend_rest.models.entities.Artist;
import com.tp_distribuidos.backend_rest.models.entities.Work;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class WorkDetailDTOTest {

    private static final Long WORK_ID = 10L;
    private static final Long ARTIST_ID = 1L;

    @Test
    void mapsAllWorkFieldsFromEntity() {
        Work work = buildWork(buildArtist());

        WorkDetailDTO dto = WorkDetailDTO.fromEntity(work);

        assertThat(dto.id()).isEqualTo(WORK_ID);
        assertThat(dto.title()).isEqualTo("La noche estrellada");
        assertThat(dto.imageUrl()).isEqualTo("https://museo.org/obras/noche-estrellada.jpg");
        assertThat(dto.creationYear()).isEqualTo(1889);
        assertThat(dto.technique()).isEqualTo(WorkTechnique.OLEO);
        assertThat(dto.dimensions()).isEqualTo("73.7 cm x 92.1 cm");
        assertThat(dto.era()).isEqualTo(WorkEra.IMPRESIONISMO);
        assertThat(dto.description()).isEqualTo("Representa la vista nocturna...");
        assertThat(dto.location()).isEqualTo(WorkLocation.SALA_4_ARTE_MODERNO);
        assertThat(dto.availability()).isEqualTo(WorkAvailability.EN_EXHIBICION);
    }

    @Test
    void mapsArtistSummaryWhenArtistIsPresent() {
        Work work = buildWork(buildArtist());

        WorkDetailDTO dto = WorkDetailDTO.fromEntity(work);

        assertThat(dto.artist()).isNotNull();
        assertThat(dto.artist().id()).isEqualTo(ARTIST_ID);
        assertThat(dto.artist().name()).isEqualTo("Vincent van Gogh");
        assertThat(dto.artist().biography()).isEqualTo("Pintor neerlandes.");
    }

    @Test
    void returnsNullArtistWhenWorkHasNoArtist() {
        Work work = buildWork(null);

        WorkDetailDTO dto = WorkDetailDTO.fromEntity(work);

        assertThat(dto.artist()).isNull();
    }

    private Work buildWork(Artist artist) {
        Work work = Work.of(
                "La noche estrellada",
                artist,
                "https://museo.org/obras/noche-estrellada.jpg",
                1889,
                WorkTechnique.OLEO,
                "73.7 cm x 92.1 cm",
                WorkEra.IMPRESIONISMO,
                "Representa la vista nocturna...",
                WorkLocation.SALA_4_ARTE_MODERNO,
                WorkAvailability.EN_EXHIBICION);
        ReflectionTestUtils.setField(work, "id", WORK_ID);
        return work;
    }

    private Artist buildArtist() {
        Artist artist = Artist.of("Vincent van Gogh", "Pintor neerlandes.");
        ReflectionTestUtils.setField(artist, "id", ARTIST_ID);
        return artist;
    }
}
