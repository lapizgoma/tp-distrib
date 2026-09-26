package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.SavedEventFilterRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.SavedEventFilterResponseDTO;
import com.tp_distribuidos.backend_rest.exceptions.SavedEventFilterNotFoundException;
import com.tp_distribuidos.backend_rest.models.entities.SavedEventFilter;
import com.tp_distribuidos.backend_rest.models.entities.User;
import com.tp_distribuidos.backend_rest.repositories.SavedEventFilterRepository;
import com.tp_distribuidos.backend_rest.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SavedEventFilterService {

    private final SavedEventFilterRepository filterRepository;
    private final UserRepository userRepository;

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Usuario autenticado no encontrado: " + email));
    }

    @Transactional(readOnly = true)
    public List<SavedEventFilterResponseDTO> getAllForCurrentUser() {
        User user = getAuthenticatedUser();
        return filterRepository.findByUserId(user.getId())
                .stream()
                .map(SavedEventFilterResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public SavedEventFilterResponseDTO getByIdForCurrentUser(Long id) {
        User user = getAuthenticatedUser();
        SavedEventFilter filter = filterRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new SavedEventFilterNotFoundException("Filtro guardado no encontrado con id: " + id));
        return SavedEventFilterResponseDTO.fromEntity(filter);
    }

    @Transactional
    public SavedEventFilterResponseDTO create(SavedEventFilterRequestDTO request) {
        User user = getAuthenticatedUser();

        SavedEventFilter filter = SavedEventFilter.of(
                user,
                request.getName(),
                request.getDescription(),
                request.getFilterConfig()
        );

        SavedEventFilter saved = filterRepository.save(filter);
        return SavedEventFilterResponseDTO.fromEntity(saved);
    }

    @Transactional
    public SavedEventFilterResponseDTO update(Long id, SavedEventFilterRequestDTO request) {
        User user = getAuthenticatedUser();
        SavedEventFilter filter = filterRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new SavedEventFilterNotFoundException("Filtro guardado no encontrado con id: " + id));

        filter.update(request.getName(), request.getDescription(), request.getFilterConfig());
        return SavedEventFilterResponseDTO.fromEntity(filter);
    }

    @Transactional
    public void delete(Long id) {
        User user = getAuthenticatedUser();
        SavedEventFilter filter = filterRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new SavedEventFilterNotFoundException("Filtro guardado no encontrado con id: " + id));

        filterRepository.delete(filter);
    }
}