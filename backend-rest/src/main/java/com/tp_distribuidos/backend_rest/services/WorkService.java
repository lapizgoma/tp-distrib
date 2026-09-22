package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.WorkDetailDTO;
import com.tp_distribuidos.backend_rest.models.entities.Work;
import com.tp_distribuidos.backend_rest.repositories.WorkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class WorkService {

    private final WorkRepository workRepository;

    @Transactional(readOnly = true)
    public WorkDetailDTO getWorkById(Long id) {
        Work work = workRepository.findByIdWithArtist(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Obra no encontrada con id: " + id));

        return WorkDetailDTO.fromEntity(work);
    }
}