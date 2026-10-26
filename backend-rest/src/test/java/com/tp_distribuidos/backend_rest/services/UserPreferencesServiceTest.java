package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.UserPreferencesRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.UserPreferencesResponseDTO;
import com.tp_distribuidos.backend_rest.enums.WorkEra;
import com.tp_distribuidos.backend_rest.enums.WorkTechnique;
import com.tp_distribuidos.backend_rest.enums.WorkTopic;
import com.tp_distribuidos.backend_rest.models.entities.UserPreference;
import com.tp_distribuidos.backend_rest.repositories.UserPreferenceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserPreferencesServiceTest {

    private static final Long USER_ID = 5L;

    @Mock
    private UserPreferenceRepository preferenceRepository;

    @InjectMocks
    private UserPreferencesService preferenceService;

    @Test
    void getForUserReturnsEmptyListsWhenUserHasNoPreferences() {
        when(preferenceRepository.findById(USER_ID)).thenReturn(Optional.empty());

        UserPreferencesResponseDTO result = preferenceService.getForUser(USER_ID);

        assertThat(result.userId()).isEqualTo(USER_ID);
        assertThat(result.favoriteTopics()).isEmpty();
        assertThat(result.favoriteTechniques()).isEmpty();
        assertThat(result.favoriteEras()).isEmpty();
    }

    @Test
    void getForUserMapsStoredPreferences() {
        UserPreference preference = UserPreference.forUser(USER_ID);
        preference.update(
                List.of(WorkTopic.NATURALEZA, WorkTopic.RETRATO),
                List.of(WorkTechnique.OLEO),
                List.of(WorkEra.IMPRESIONISMO));
        when(preferenceRepository.findById(USER_ID)).thenReturn(Optional.of(preference));

        UserPreferencesResponseDTO result = preferenceService.getForUser(USER_ID);

        assertThat(result.userId()).isEqualTo(USER_ID);
        assertThat(result.favoriteTopics()).containsExactly(WorkTopic.NATURALEZA, WorkTopic.RETRATO);
        assertThat(result.favoriteTechniques()).containsExactly(WorkTechnique.OLEO);
        assertThat(result.favoriteEras()).containsExactly(WorkEra.IMPRESIONISMO);
    }

    @Test
    void updateCreatesPreferencesWhenUserHasNoRow() {
        when(preferenceRepository.findById(USER_ID)).thenReturn(Optional.empty());
        when(preferenceRepository.save(any(UserPreference.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserPreferencesResponseDTO result = preferenceService.updateForUser(USER_ID, buildRequest());

        assertThat(result.userId()).isEqualTo(USER_ID);
        assertThat(result.favoriteTopics()).containsExactly(WorkTopic.NATURALEZA);
        assertThat(result.favoriteTechniques()).containsExactly(WorkTechnique.TEMPLE);
        assertThat(result.favoriteEras()).containsExactly(WorkEra.RENACIMIENTO);
        verify(preferenceRepository).save(any(UserPreference.class));
    }

    @Test
    void updateReplacesExistingPreferences() {
        UserPreference preference = UserPreference.forUser(USER_ID);
        preference.update(
                List.of(WorkTopic.GUERRA),
                List.of(WorkTechnique.OLEO),
                List.of(WorkEra.VANGUARDIA));
        when(preferenceRepository.findById(USER_ID)).thenReturn(Optional.of(preference));
        when(preferenceRepository.save(any(UserPreference.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserPreferencesResponseDTO result = preferenceService.updateForUser(USER_ID, buildRequest());

        assertThat(result.favoriteTopics()).containsExactly(WorkTopic.NATURALEZA);
        assertThat(result.favoriteTechniques()).containsExactly(WorkTechnique.TEMPLE);
        assertThat(result.favoriteEras()).containsExactly(WorkEra.RENACIMIENTO);
        verify(preferenceRepository).save(any(UserPreference.class));
    }

    @Test
    void deleteRemovesPreferencesWhenTheyExist() {
        UserPreference preference = UserPreference.forUser(USER_ID);
        when(preferenceRepository.findById(USER_ID)).thenReturn(Optional.of(preference));

        preferenceService.deleteForUser(USER_ID);

        verify(preferenceRepository).delete(preference);
    }

    @Test
    void deleteDoesNothingWhenUserHasNoPreferences() {
        when(preferenceRepository.findById(USER_ID)).thenReturn(Optional.empty());

        preferenceService.deleteForUser(USER_ID);

        verify(preferenceRepository, never()).delete(any(UserPreference.class));
    }

    private UserPreferencesRequestDTO buildRequest() {
        return new UserPreferencesRequestDTO(
                List.of(WorkTopic.NATURALEZA),
                List.of(WorkTechnique.TEMPLE),
                List.of(WorkEra.RENACIMIENTO));
    }
}
