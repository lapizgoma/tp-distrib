package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.EventFilterRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.EventRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.EventResponseDTO;
import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import com.tp_distribuidos.backend_rest.models.entities.User;
import com.tp_distribuidos.backend_rest.repositories.EventRepository;
import com.tp_distribuidos.backend_rest.repositories.UserRepository;
import com.tp_distribuidos.backend_rest.specifications.EventSpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<EventResponseDTO> getAllEvents(EventFilterRequestDTO filter) {
        validateDateRange(filter);
        return eventRepository
                .findAll(EventSpecifications.withFilters(filter), Sort.by(Sort.Direction.ASC, "datetime"))
                .stream()
                .map(EventResponseDTO::fromEntity)
                .toList();
    }

    private void validateDateRange(EventFilterRequestDTO filter) {
        if (filter != null && filter.getFechaDesde() != null && filter.getFechaHasta() != null
                && filter.getFechaDesde().isAfter(filter.getFechaHasta())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fecha 'fechaDesde' no puede ser posterior a 'fechaHasta'");
        }
    }

    @Transactional(readOnly = true)
    public EventResponseDTO getEventById(Long id) {
        Event event = eventRepository.findByIdWithCurator(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado con ID: " + id));
        return EventResponseDTO.fromEntity(event);
    }

    @Transactional
    public EventResponseDTO createEvent(EventRequestDTO dto) {
        User leadCurator = getCuratorOrThrow(dto.getLeadCuratorId());

        Event event = Event.of(
                dto.getTitle(),
                dto.getDescription(),
                dto.getDatetime(),
                dto.getDuration(),
                leadCurator,
                dto.getMaximumCapacity(),
                dto.getEventType()
        );

        return EventResponseDTO.fromEntity(eventRepository.save(event));
    }

    @Transactional
    public EventResponseDTO updateEvent(Long id, EventRequestDTO dto) {
        Event event = eventRepository.findByIdWithCurator(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado con ID: " + id));

        User leadCurator = getCuratorOrThrow(dto.getLeadCuratorId());

        event.update(
                dto.getTitle(),
                dto.getDescription(),
                dto.getDatetime(),
                dto.getDuration(),
                leadCurator,
                dto.getMaximumCapacity(),
                dto.getEventType()
        );

        return EventResponseDTO.fromEntity(eventRepository.save(event));
    }

    @Transactional
    public void deleteEvent(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado con ID: " + id);
        }
        eventRepository.deleteById(id);
    }

    private User getCuratorOrThrow(Long curatorId) {
        User user = userRepository.findById(curatorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado con ID: " + curatorId));

        if (user.getRole() != UserRole.CURADOR && user.getRole() != UserRole.ADMINISTRADOR) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario asignado como curador a cargo debe tener rol CURADOR o ADMINISTRADOR");
        }
        return user;
    }
}