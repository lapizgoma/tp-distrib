package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.UserPreferencesRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.UserPreferencesResponseDTO;
import com.tp_distribuidos.backend_rest.models.entities.UserPreference;
import com.tp_distribuidos.backend_rest.repositories.UserPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserPreferencesService {

    private final UserPreferenceRepository preferenceRepository;

    @Transactional(readOnly = true)
    public UserPreferencesResponseDTO getForUser(Long userId) {
        return preferenceRepository.findById(userId)
                .map(UserPreferencesResponseDTO::fromEntity)
                .orElseGet(() -> UserPreferencesResponseDTO.empty(userId));
    }

    @Transactional
    public UserPreferencesResponseDTO updateForUser(Long userId, UserPreferencesRequestDTO request) {
        UserPreference preference = preferenceRepository.findById(userId)
                .orElseGet(() -> UserPreference.forUser(userId));

        preference.update(
                request.favoriteTopics(),
                request.favoriteTechniques(),
                request.favoriteEras());

        return UserPreferencesResponseDTO.fromEntity(preferenceRepository.save(preference));
    }

    @Transactional
    public void deleteForUser(Long userId) {
        preferenceRepository.findById(userId).ifPresent(preferenceRepository::delete);
    }
}
