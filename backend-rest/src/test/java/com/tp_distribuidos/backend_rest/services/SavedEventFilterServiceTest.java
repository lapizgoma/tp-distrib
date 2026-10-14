package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.EventFilterConfigDTO;
import com.tp_distribuidos.backend_rest.dtos.SavedEventFilterRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.SavedEventFilterResponseDTO;
import com.tp_distribuidos.backend_rest.enums.EventType;
import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.exceptions.ApiException;
import com.tp_distribuidos.backend_rest.models.entities.SavedEventFilter;
import com.tp_distribuidos.backend_rest.models.entities.User;
import com.tp_distribuidos.backend_rest.repositories.SavedEventFilterRepository;
import com.tp_distribuidos.backend_rest.repositories.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SavedEventFilterServiceTest {

    private static final String EMAIL = "ana@museo.com";
    private static final Long USER_ID = 5L;
    private static final Long FILTER_ID = 40L;
    private static final Long CURATOR_ID = 2L;

    @Mock
    private SavedEventFilterRepository filterRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SavedEventFilterService filterService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(EMAIL, null));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getAllForCurrentUserMapsEveryFilter() {
        User user = buildUser(USER_ID);
        SavedEventFilter filter = buildFilter(FILTER_ID, user, "Talleres fin de semana", "desc", buildConfig());
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(filterRepository.findByUserId(USER_ID)).thenReturn(List.of(filter));

        List<SavedEventFilterResponseDTO> result = filterService.getAllForCurrentUser();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(FILTER_ID);
        assertThat(result.get(0).userId()).isEqualTo(USER_ID);
        assertThat(result.get(0).name()).isEqualTo("Talleres fin de semana");
    }

    @Test
    void getAllForCurrentUserReturnsEmptyListWhenUserHasNoFilters() {
        User user = buildUser(USER_ID);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(filterRepository.findByUserId(USER_ID)).thenReturn(List.of());

        List<SavedEventFilterResponseDTO> result = filterService.getAllForCurrentUser();

        assertThat(result).isEmpty();
    }

    @Test
    void getAllForCurrentUserThrowsNotFoundAndDoesNotQueryFiltersWhenUserDoesNotExist() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> filterService.getAllForCurrentUser())
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Usuario autenticado no encontrado: " + EMAIL);
                });
        verifyNoInteractions(filterRepository);
    }

    @Test
    void getByIdForCurrentUserReturnsDetailWhenFilterExistsForUser() {
        User user = buildUser(USER_ID);
        SavedEventFilter filter = buildFilter(FILTER_ID, user, "Talleres fin de semana", "desc", buildConfig());
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(filterRepository.findByIdAndUserId(FILTER_ID, USER_ID)).thenReturn(Optional.of(filter));

        SavedEventFilterResponseDTO result = filterService.getByIdForCurrentUser(FILTER_ID);

        assertThat(result.id()).isEqualTo(FILTER_ID);
        assertThat(result.name()).isEqualTo("Talleres fin de semana");
        assertThat(result.filterConfig().curatorId()).isEqualTo(CURATOR_ID);
    }

    @Test
    void getByIdForCurrentUserThrowsNotFoundWhenFilterDoesNotBelongToUser() {
        User user = buildUser(USER_ID);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(filterRepository.findByIdAndUserId(FILTER_ID, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> filterService.getByIdForCurrentUser(FILTER_ID))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Filtro guardado no encontrado con id: " + FILTER_ID);
                });
    }

    @Test
    void getByIdForCurrentUserThrowsNotFoundAndDoesNotQueryFiltersWhenUserDoesNotExist() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> filterService.getByIdForCurrentUser(FILTER_ID))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Usuario autenticado no encontrado: " + EMAIL);
                });
        verifyNoInteractions(filterRepository);
    }

    @Test
    void createSavesFilterAndReturnsDetailWhenUserExists() {
        User user = buildUser(USER_ID);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(filterRepository.save(any(SavedEventFilter.class))).thenAnswer(invocation -> {
            SavedEventFilter saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", FILTER_ID);
            return saved;
        });

        SavedEventFilterResponseDTO result = filterService.create(buildRequest("Talleres fin de semana"));

        assertThat(result.id()).isEqualTo(FILTER_ID);
        assertThat(result.userId()).isEqualTo(USER_ID);
        assertThat(result.name()).isEqualTo("Talleres fin de semana");
        assertThat(result.filterConfig().curatorId()).isEqualTo(CURATOR_ID);
        verify(filterRepository).save(any(SavedEventFilter.class));
    }

    @Test
    void createThrowsNotFoundAndDoesNotSaveWhenUserDoesNotExist() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> filterService.create(buildRequest("Talleres fin de semana")))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Usuario autenticado no encontrado: " + EMAIL);
                });
        verify(filterRepository, never()).save(any(SavedEventFilter.class));
    }

    @Test
    void updateReplacesFieldsAndReturnsDetailWhenFilterExistsForUser() {
        User user = buildUser(USER_ID);
        SavedEventFilterRequestDTO request = buildRequest("Nuevo");
        EventFilterConfigDTO newConfig = request.getFilterConfig();
        SavedEventFilter filter = buildFilter(FILTER_ID, user, "Viejo", "vieja desc",
                EventFilterConfigDTO.of(EventType.TALLER, null, null, null));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(filterRepository.findByIdAndUserId(FILTER_ID, USER_ID)).thenReturn(Optional.of(filter));

        SavedEventFilterResponseDTO result = filterService.update(FILTER_ID, request);

        assertThat(filter.getName()).isEqualTo("Nuevo");
        assertThat(filter.getDescription()).isEqualTo("desc");
        assertThat(filter.getFilterConfig()).isSameAs(newConfig);
        assertThat(result.name()).isEqualTo("Nuevo");
        assertThat(result.filterConfig()).isEqualTo(newConfig);
        verify(filterRepository, never()).save(any(SavedEventFilter.class));
    }

    @Test
    void updateThrowsNotFoundWhenFilterDoesNotBelongToUser() {
        User user = buildUser(USER_ID);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(filterRepository.findByIdAndUserId(FILTER_ID, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> filterService.update(FILTER_ID, buildRequest("Nuevo")))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Filtro guardado no encontrado con id: " + FILTER_ID);
                });
    }

    @Test
    void updateThrowsNotFoundAndDoesNotQueryFiltersWhenUserDoesNotExist() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> filterService.update(FILTER_ID, buildRequest("Nuevo")))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Usuario autenticado no encontrado: " + EMAIL);
                });
        verifyNoInteractions(filterRepository);
    }

    @Test
    void deleteDeletesFilterWhenItExistsForUser() {
        User user = buildUser(USER_ID);
        SavedEventFilter filter = buildFilter(FILTER_ID, user, "Talleres fin de semana", "desc", buildConfig());
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(filterRepository.findByIdAndUserId(FILTER_ID, USER_ID)).thenReturn(Optional.of(filter));

        filterService.delete(FILTER_ID);

        verify(filterRepository).delete(filter);
    }

    @Test
    void deleteThrowsNotFoundAndDoesNotDeleteWhenFilterDoesNotBelongToUser() {
        User user = buildUser(USER_ID);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(filterRepository.findByIdAndUserId(FILTER_ID, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> filterService.delete(FILTER_ID))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Filtro guardado no encontrado con id: " + FILTER_ID);
                });
        verify(filterRepository, never()).delete(any(SavedEventFilter.class));
    }

    @Test
    void deleteThrowsNotFoundAndDoesNotQueryFiltersWhenUserDoesNotExist() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> filterService.delete(FILTER_ID))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Usuario autenticado no encontrado: " + EMAIL);
                });
        verifyNoInteractions(filterRepository);
    }

    private User buildUser(Long id) {
        User user = User.of(EMAIL, "secret", UserRole.VISITANTE);
        if (id != null) {
            ReflectionTestUtils.setField(user, "id", id);
        }
        return user;
    }

    private SavedEventFilter buildFilter(Long id, User user, String name, String description,
                                         EventFilterConfigDTO config) {
        SavedEventFilter filter = SavedEventFilter.of(user, name, description, config);
        if (id != null) {
            ReflectionTestUtils.setField(filter, "id", id);
        }
        return filter;
    }

    private SavedEventFilterRequestDTO buildRequest(String name) {
        SavedEventFilterRequestDTO request = new SavedEventFilterRequestDTO();
        request.setName(name);
        request.setDescription("desc");
        request.setFilterConfig(buildConfig());
        return request;
    }

    private EventFilterConfigDTO buildConfig() {
        return EventFilterConfigDTO.of(
                EventType.VISITA_GUIADA,
                CURATOR_ID,
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 12, 31));
    }
}
