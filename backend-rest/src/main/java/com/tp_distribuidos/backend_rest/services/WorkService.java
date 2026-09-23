package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.WorkDetailDTO;
import com.tp_distribuidos.backend_rest.dtos.WorkRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.WorkSummaryDTO;
import com.tp_distribuidos.backend_rest.exceptions.ArtistNotFoundException;
import com.tp_distribuidos.backend_rest.exceptions.WorkNotFoundException;
import com.tp_distribuidos.backend_rest.models.entities.Artist;
import com.tp_distribuidos.backend_rest.models.entities.Work;
import com.tp_distribuidos.backend_rest.repositories.ArtistRepository;
import com.tp_distribuidos.backend_rest.repositories.CommentRepository;
import com.tp_distribuidos.backend_rest.repositories.WorkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkService {

    private final WorkRepository workRepository;
    private final ArtistRepository artistRepository;
    private final CommentRepository commentRepository;

    @Transactional(readOnly = true)
    public List<WorkSummaryDTO> getAllWorks() {
        return workRepository.findAllWithArtist()
                .stream()
                .map(WorkSummaryDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public WorkDetailDTO getWorkById(Long id) {
        Work work = workRepository.findByIdWithArtist(id)
                .orElseThrow(() -> new WorkNotFoundException(id));

        return WorkDetailDTO.fromEntity(work);
    }

    @Transactional
    public WorkDetailDTO createWork(WorkRequestDTO request) {
        Artist artist = findArtist(request.artistId());

        Work work = Work.of(
                request.title(),
                artist,
                request.imageUrl(),
                request.creationYear(),
                request.technique(),
                request.dimensions(),
                request.era(),
                request.description(),
                request.location(),
                request.availability());

        return WorkDetailDTO.fromEntity(workRepository.save(work));
    }

    @Transactional
    public WorkDetailDTO updateWork(Long id, WorkRequestDTO request) {
        Work work = workRepository.findByIdWithArtist(id)
                .orElseThrow(() -> new WorkNotFoundException(id));

        Artist artist = findArtist(request.artistId());

        work.update(
                request.title(),
                artist,
                request.imageUrl(),
                request.creationYear(),
                request.technique(),
                request.dimensions(),
                request.era(),
                request.description(),
                request.location(),
                request.availability());

        return WorkDetailDTO.fromEntity(work);
    }

    @Transactional
    public void deleteWork(Long id) {
        Work work = workRepository.findById(id)
                .orElseThrow(() -> new WorkNotFoundException(id));

        commentRepository.deleteByWorkId(id);
        workRepository.delete(work);
    }

    private Artist findArtist(Long artistId) {
        return artistRepository.findById(artistId)
                .orElseThrow(() -> new ArtistNotFoundException(artistId));
    }
}
