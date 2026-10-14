package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.WorkDetailDTO;
import com.tp_distribuidos.backend_rest.dtos.WorkFiltersDTO;
import com.tp_distribuidos.backend_rest.dtos.WorkRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.WorkSummaryDTO;
import com.tp_distribuidos.backend_rest.enums.WorkAvailability;
import com.tp_distribuidos.backend_rest.enums.WorkEra;
import com.tp_distribuidos.backend_rest.enums.WorkLocation;
import com.tp_distribuidos.backend_rest.enums.WorkTechnique;
import com.tp_distribuidos.backend_rest.exceptions.ApiException;
import com.tp_distribuidos.backend_rest.models.entities.Artist;
import com.tp_distribuidos.backend_rest.models.entities.Work;
import com.tp_distribuidos.backend_rest.repositories.ArtistRepository;
import com.tp_distribuidos.backend_rest.repositories.CommentRepository;
import com.tp_distribuidos.backend_rest.repositories.WorkRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkServiceTest {

    private static final Long WORK_ID = 10L;
    private static final Long ARTIST_ID = 1L;
    private static final String IMAGE_URL = "https://museo.org/obras/noche-estrellada.jpg";

    @Mock
    private WorkRepository workRepository;

    @Mock
    private ArtistRepository artistRepository;

    @Mock
    private CommentRepository commentRepository;

    @InjectMocks
    private WorkService workService;

    @Test
    void getAllWorksReturnsEmptyListWhenThereAreNoWorks() {
        when(workRepository.findAllWithArtist()).thenReturn(List.of());

        List<WorkSummaryDTO> result = workService.getAllWorks();

        assertThat(result).isEmpty();
        verify(workRepository).findAllWithArtist();
    }

    @Test
    void getAllWorksMapsEveryWorkToSummary() {
        Work work = buildWork(WORK_ID, buildArtist(ARTIST_ID));
        when(workRepository.findAllWithArtist()).thenReturn(List.of(work));

        List<WorkSummaryDTO> result = workService.getAllWorks();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(WORK_ID);
        assertThat(result.get(0).title()).isEqualTo("La noche estrellada");
        assertThat(result.get(0).imageUrl()).isEqualTo(IMAGE_URL);
        assertThat(result.get(0).creationYear()).isEqualTo(1889);
    }

    @Test
    void getFilterOptionsReturnsAllEnumValues() {
        WorkFiltersDTO result = workService.getFilterOptions();

        assertThat(result.eras()).containsExactly(
                WorkEra.RENACIMIENTO.name(), WorkEra.BARROCO.name(),
                WorkEra.IMPRESIONISMO.name(), WorkEra.VANGUARDIA.name(),
                WorkEra.CONTEMPORANEO.name());
        assertThat(result.techniques()).containsExactly(
                WorkTechnique.OLEO.name(), WorkTechnique.ACRILICO.name(),
                WorkTechnique.ACUARELA.name(), WorkTechnique.TEMPLE.name(),
                WorkTechnique.ESCULTURA.name());
        assertThat(result.locations()).containsExactly(
                WorkLocation.SALA_1_GRANDES_MAESTROS.name(), WorkLocation.SALA_2_IMPRESIONISMO.name(),
                WorkLocation.SALA_3_VANGUARDIAS.name(), WorkLocation.SALA_4_ARTE_MODERNO.name(),
                WorkLocation.DEPOSITO.name());
    }

    @Test
    void getWorkByIdReturnsDetailWhenItExists() {
        Work work = buildWork(WORK_ID, buildArtist(ARTIST_ID));
        when(workRepository.findByIdWithArtist(WORK_ID)).thenReturn(Optional.of(work));

        WorkDetailDTO result = workService.getWorkById(WORK_ID);

        assertThat(result.getId()).isEqualTo(WORK_ID);
        assertThat(result.getTitle()).isEqualTo("La noche estrellada");
        assertThat(result.getArtist().getId()).isEqualTo(ARTIST_ID);
        assertThat(result.getArtist().getName()).isEqualTo("Vincent van Gogh");
    }

    @Test
    void getWorkByIdThrowsNotFoundWhenItDoesNotExist() {
        when(workRepository.findByIdWithArtist(WORK_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workService.getWorkById(WORK_ID))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Obra no encontrada con id: " + WORK_ID);
                });
    }

    @Test
    void createWorkSavesAndReturnsDetailWhenArtistExists() {
        Artist artist = buildArtist(ARTIST_ID);
        when(artistRepository.findById(ARTIST_ID)).thenReturn(Optional.of(artist));
        when(workRepository.save(any(Work.class))).thenAnswer(invocation -> {
            Work saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", WORK_ID);
            return saved;
        });

        WorkDetailDTO result = workService.createWork(buildRequest(ARTIST_ID));

        assertThat(result.getId()).isEqualTo(WORK_ID);
        assertThat(result.getTitle()).isEqualTo("La noche estrellada");
        assertThat(result.getAvailability()).isEqualTo(WorkAvailability.EN_EXHIBICION);
        assertThat(result.getArtist().getId()).isEqualTo(ARTIST_ID);
        verify(artistRepository).findById(ARTIST_ID);
        verify(workRepository).save(any(Work.class));
    }

    @Test
    void createWorkThrowsNotFoundAndDoesNotSaveWhenArtistDoesNotExist() {
        when(artistRepository.findById(ARTIST_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workService.createWork(buildRequest(ARTIST_ID)))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Artista no encontrado con id: " + ARTIST_ID);
                });
        verify(workRepository, never()).save(any(Work.class));
    }

    @Test
    void updateWorkUpdatesEntityAndReturnsDetailWhenWorkAndArtistExist() {
        Work work = buildWork(WORK_ID, buildArtist(ARTIST_ID));
        Artist newArtist = buildArtist(ARTIST_ID);
        when(workRepository.findByIdWithArtist(WORK_ID)).thenReturn(Optional.of(work));
        when(artistRepository.findById(ARTIST_ID)).thenReturn(Optional.of(newArtist));

        WorkDetailDTO result = workService.updateWork(WORK_ID, buildRequest(ARTIST_ID));

        assertThat(result.getId()).isEqualTo(WORK_ID);
        assertThat(work.getArtist()).isSameAs(newArtist);
        assertThat(work.getTitle()).isEqualTo("La noche estrellada");
        assertThat(work.getAvailability()).isEqualTo(WorkAvailability.EN_EXHIBICION);
        verify(workRepository, never()).save(any(Work.class));
    }

    @Test
    void updateWorkThrowsNotFoundAndDoesNotLookUpArtistWhenWorkDoesNotExist() {
        when(workRepository.findByIdWithArtist(WORK_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workService.updateWork(WORK_ID, buildRequest(ARTIST_ID)))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Obra no encontrada con id: " + WORK_ID);
                });
        verifyNoInteractions(artistRepository);
    }

    @Test
    void updateWorkThrowsNotFoundWhenArtistDoesNotExist() {
        Work work = buildWork(WORK_ID, buildArtist(ARTIST_ID));
        when(workRepository.findByIdWithArtist(WORK_ID)).thenReturn(Optional.of(work));
        when(artistRepository.findById(ARTIST_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workService.updateWork(WORK_ID, buildRequest(ARTIST_ID)))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Artista no encontrado con id: " + ARTIST_ID);
                });
    }

    @Test
    void deleteWorkDeletesCommentsBeforeWorkWhenItExists() {
        Work work = buildWork(WORK_ID, buildArtist(ARTIST_ID));
        when(workRepository.findById(WORK_ID)).thenReturn(Optional.of(work));

        workService.deleteWork(WORK_ID);

        InOrder inOrder = inOrder(commentRepository, workRepository);
        inOrder.verify(commentRepository).deleteByWorkId(WORK_ID);
        inOrder.verify(workRepository).delete(work);
    }

    @Test
    void deleteWorkThrowsNotFoundAndDeletesNothingWhenItDoesNotExist() {
        when(workRepository.findById(WORK_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workService.deleteWork(WORK_ID))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Obra no encontrada con id: " + WORK_ID);
                });
        verifyNoInteractions(commentRepository);
        verify(workRepository, never()).delete(any(Work.class));
    }

    private Work buildWork(Long id, Artist artist) {
        Work work = Work.of(
                "La noche estrellada",
                artist,
                IMAGE_URL,
                1889,
                WorkTechnique.OLEO,
                "73.7 cm x 92.1 cm",
                WorkEra.IMPRESIONISMO,
                "Representa la vista nocturna...",
                WorkLocation.SALA_4_ARTE_MODERNO,
                WorkAvailability.EN_EXHIBICION);
        if (id != null) {
            ReflectionTestUtils.setField(work, "id", id);
        }
        return work;
    }

    private Artist buildArtist(Long id) {
        Artist artist = Artist.of("Vincent van Gogh", "Pintor neerlandes.");
        if (id != null) {
            ReflectionTestUtils.setField(artist, "id", id);
        }
        return artist;
    }

    private WorkRequestDTO buildRequest(Long artistId) {
        return new WorkRequestDTO(
                "La noche estrellada",
                artistId,
                IMAGE_URL,
                1889,
                WorkTechnique.OLEO,
                "73.7 cm x 92.1 cm",
                WorkEra.IMPRESIONISMO,
                "Representa la vista nocturna...",
                WorkLocation.SALA_4_ARTE_MODERNO,
                WorkAvailability.EN_EXHIBICION);
    }
}
