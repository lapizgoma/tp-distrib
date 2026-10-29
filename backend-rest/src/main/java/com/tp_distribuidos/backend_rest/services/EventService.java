package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.EventAttendeeDTO;
import com.tp_distribuidos.backend_rest.dtos.EventFieldChangeDTO;
import com.tp_distribuidos.backend_rest.dtos.EventFilterRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.EventRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.EventResponseDTO;
import com.tp_distribuidos.backend_rest.dtos.EventSnapshotDTO;
import com.tp_distribuidos.backend_rest.enums.EventNewsType;
import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.exceptions.ApiException;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import com.tp_distribuidos.backend_rest.models.entities.User;
import com.tp_distribuidos.backend_rest.repositories.EventRegistrationRepository;
import com.tp_distribuidos.backend_rest.repositories.EventRepository;
import com.tp_distribuidos.backend_rest.repositories.UserRepository;
import com.tp_distribuidos.backend_rest.security.SecurityUser;
import com.tp_distribuidos.backend_rest.specifications.EventSpecifications;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final EventRegistrationRepository registrationRepository;
    private final EventOutboxService eventOutboxService;

    @Transactional(readOnly = true)
    public List<EventResponseDTO> getAllEvents(EventFilterRequestDTO filter) {
        validateDateRange(filter);
        return eventRepository
                .findAll(EventSpecifications.withFilters(filter), Sort.by(Sort.Direction.ASC, Event::getDatetime))
                .stream()
                .map(EventResponseDTO::fromEntity)
                .toList();
    }

    private void validateDateRange(EventFilterRequestDTO filter) {
        if (filter != null && filter.getStartDate() != null && filter.getEndDate() != null
                && filter.getStartDate().isAfter(filter.getEndDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "La fecha 'startDate' no puede ser posterior a 'endDate'");
        }
    }

    @Transactional(readOnly = true)
    public EventResponseDTO getEventById(Long id) {
        Event event = eventRepository.findByIdWithCurator(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Evento no encontrado con ID: " + id));

        User viewer = getAuthenticatedUserOrNull();

        List<EventAttendeeDTO> attendees = null;
        if (canViewAttendees(event, viewer)) {
            attendees = registrationRepository.findByEventIdWithUser(id)
                    .stream()
                    .map(EventAttendeeDTO::fromEntity)
                    .toList();
        }

        Boolean isRegistered = viewer != null
                ? registrationRepository.existsByEventIdAndUserId(id, viewer.getId())
                : null;

        return EventResponseDTO.fromEntity(event, attendees, isRegistered);
    }

    private boolean canViewAttendees(Event event, User viewer) {
        if (viewer == null) {
            return false;
        }
        if (viewer.getRole() == UserRole.ADMINISTRADOR) {
            return true;
        }
        return event.getLeadCurator() != null && event.getLeadCurator().getId().equals(viewer.getId());
    }

    private User getAuthenticatedUserOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    private Long getAuthenticatedUserIdOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return null;
        }
        if (auth.getPrincipal() instanceof SecurityUser securityUser) {
            return securityUser.getId();
        }
        return userRepository.findByEmail(auth.getName())
                .map(User::getId)
                .orElse(null);
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

        Event saved = eventRepository.save(event);
        eventOutboxService.enqueue(
                saved,
                EventNewsType.EVENT_CREATED,
                getAuthenticatedUserIdOrNull(),
                Instant.now(),
                null
        );
        return EventResponseDTO.fromEntity(saved);
    }

    @Transactional
    public EventResponseDTO updateEvent(Long id, EventRequestDTO dto) {
        Event event = eventRepository.findByIdWithCurator(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Evento no encontrado con ID: " + id));

        User leadCurator = getCuratorOrThrow(dto.getLeadCuratorId());
        EventSnapshotDTO previous = EventSnapshotDTO.fromEntity(event);

        event.update(
                dto.getTitle(),
                dto.getDescription(),
                dto.getDatetime(),
                dto.getDuration(),
                leadCurator,
                dto.getMaximumCapacity(),
                dto.getEventType()
        );

        EventSnapshotDTO current = EventSnapshotDTO.fromEntity(event);
        Map<String, EventFieldChangeDTO> changes = EventChangeDetector.diff(previous, current);
        Event saved = eventRepository.save(event);

        if (!changes.isEmpty()) {
            eventOutboxService.enqueue(
                    saved,
                    EventNewsType.EVENT_UPDATED,
                    getAuthenticatedUserIdOrNull(),
                    Instant.now(),
                    changes
            );
        }
        return EventResponseDTO.fromEntity(saved);
    }

    @Transactional
    public void deleteEvent(Long id) {
        Event event = eventRepository.findByIdIncludingDeleted(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Evento no encontrado con ID: " + id));

        if (event.isDeleted()) {
            return;
        }
        event.markDeleted();
        eventOutboxService.enqueue(
                event,
                EventNewsType.EVENT_CANCELLED,
                getAuthenticatedUserIdOrNull(),
                Instant.now(),
                null
        );
    }

    private User getCuratorOrThrow(Long curatorId) {
        User user = userRepository.findById(curatorId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuario no encontrado con ID: " + curatorId));

        if (user.getRole() != UserRole.CURADOR && user.getRole() != UserRole.ADMINISTRADOR) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El usuario asignado como curador a cargo debe tener rol CURADOR o ADMINISTRADOR");
        }
        return user;
    }
}