package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.EventAttendeeDTO;
import com.tp_distribuidos.backend_rest.dtos.EventFilterRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.EventRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.EventResponseDTO;
import com.tp_distribuidos.backend_rest.enums.EventType;
import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.exceptions.ApiException;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import com.tp_distribuidos.backend_rest.models.entities.EventRegistration;
import com.tp_distribuidos.backend_rest.models.entities.User;
import com.tp_distribuidos.backend_rest.repositories.EventRegistrationRepository;
import com.tp_distribuidos.backend_rest.repositories.EventRepository;
import com.tp_distribuidos.backend_rest.repositories.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
class EventServiceTest {

    private static final String EMAIL = "ana@museo.com";
    private static final Long USER_ID = 5L;
    private static final Long CURATOR_ID = 2L;
    private static final Long EVENT_ID = 12L;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EventRegistrationRepository registrationRepository;

    @InjectMocks
    private EventService eventService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getAllEventsMapsEveryEvent() {
        when(eventRepository.findAll(any(Specification.class), any(Sort.class)))
                .thenReturn(List.of(buildEvent(EVENT_ID, buildUser(CURATOR_ID, UserRole.CURADOR, "Ana", "Gomez"))));

        List<EventResponseDTO> result = eventService.getAllEvents(buildFilter(null, null));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(EVENT_ID);
        assertThat(result.get(0).title()).isEqualTo("Noche de Gala");
    }

    @Test
    void getAllEventsAcceptsNullFilterAndSortsByDatetimeAscending() {
        when(eventRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of());

        List<EventResponseDTO> result = eventService.getAllEvents(null);

        assertThat(result).isEmpty();
        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        verify(eventRepository).findAll(any(Specification.class), sortCaptor.capture());
        assertThat(sortCaptor.getValue().getOrderFor("datetime").getDirection()).isEqualTo(Sort.Direction.ASC);
    }

    @Test
    void getAllEventsThrowsBadRequestWhenStartDateIsAfterEndDate() {
        EventFilterRequestDTO filter = buildFilter(LocalDate.of(2026, 12, 31), LocalDate.of(2026, 1, 1));

        assertThatThrownBy(() -> eventService.getAllEvents(filter))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessage()).isEqualTo("La fecha 'startDate' no puede ser posterior a 'endDate'");
                });
        verifyNoInteractions(eventRepository, userRepository, registrationRepository);
    }

    @Test
    void getEventByIdThrowsNotFoundWhenItDoesNotExist() {
        when(eventRepository.findByIdWithCurator(EVENT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.getEventById(EVENT_ID))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Evento no encontrado con ID: " + EVENT_ID);
                });
    }

    @Test
    void getEventByIdReturnsEventWithoutAttendeesWhenThereIsNoAuthentication() {
        Event event = buildEvent(EVENT_ID, buildUser(CURATOR_ID, UserRole.CURADOR, "Ana", "Gomez"));
        when(eventRepository.findByIdWithCurator(EVENT_ID)).thenReturn(Optional.of(event));

        EventResponseDTO result = eventService.getEventById(EVENT_ID);

        assertThat(result.attendees()).isNull();
        assertThat(result.isRegistered()).isNull();
        verify(registrationRepository, never()).findByEventIdWithUser(any());
    }

    @Test
    void getEventByIdReturnsEventWithoutAttendeesWhenAuthenticationIsAnonymous() {
        SecurityContextHolder.getContext().setAuthentication(new AnonymousAuthenticationToken(
                "key", "anonymous", List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS"))));
        Event event = buildEvent(EVENT_ID, buildUser(CURATOR_ID, UserRole.CURADOR, "Ana", "Gomez"));
        when(eventRepository.findByIdWithCurator(EVENT_ID)).thenReturn(Optional.of(event));

        EventResponseDTO result = eventService.getEventById(EVENT_ID);

        assertThat(result.attendees()).isNull();
        assertThat(result.isRegistered()).isNull();
        verify(registrationRepository, never()).findByEventIdWithUser(any());
    }

    @Test
    void getEventByIdReturnsEventWithoutAttendeesWhenViewerIsNotTheLeadCurator() {
        authenticate();
        Event event = buildEvent(EVENT_ID, buildUser(CURATOR_ID, UserRole.CURADOR, "Ana", "Gomez"));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(buildUser(USER_ID, UserRole.VISITANTE, "Pepe", "Lopez")));
        when(eventRepository.findByIdWithCurator(EVENT_ID)).thenReturn(Optional.of(event));
        when(registrationRepository.existsByEventIdAndUserId(EVENT_ID, USER_ID)).thenReturn(true);

        EventResponseDTO result = eventService.getEventById(EVENT_ID);

        assertThat(result.attendees()).isNull();
        assertThat(result.isRegistered()).isTrue();
        verify(registrationRepository, never()).findByEventIdWithUser(any());
    }

    @Test
    void getEventByIdReturnsIsRegisteredFalseWhenVisitorIsNotRegistered() {
        authenticate();
        Event event = buildEvent(EVENT_ID, buildUser(CURATOR_ID, UserRole.CURADOR, "Ana", "Gomez"));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(buildUser(USER_ID, UserRole.VISITANTE, "Pepe", "Lopez")));
        when(eventRepository.findByIdWithCurator(EVENT_ID)).thenReturn(Optional.of(event));
        when(registrationRepository.existsByEventIdAndUserId(EVENT_ID, USER_ID)).thenReturn(false);

        EventResponseDTO result = eventService.getEventById(EVENT_ID);

        assertThat(result.isRegistered()).isFalse();
    }

    @Test
    void getEventByIdReturnsEventWithoutAttendeesWhenAuthenticatedUserDoesNotExist() {
        authenticate();
        Event event = buildEvent(EVENT_ID, buildUser(CURATOR_ID, UserRole.CURADOR, "Ana", "Gomez"));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(eventRepository.findByIdWithCurator(EVENT_ID)).thenReturn(Optional.of(event));

        EventResponseDTO result = eventService.getEventById(EVENT_ID);

        assertThat(result.attendees()).isNull();
        assertThat(result.isRegistered()).isNull();
    }

    @Test
    void getEventByIdReturnsEventWithoutAttendeesWhenEventHasNoLeadCurator() {
        authenticate();
        Event event = buildEvent(EVENT_ID, null);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(buildUser(USER_ID, UserRole.VISITANTE, "Pepe", "Lopez")));
        when(eventRepository.findByIdWithCurator(EVENT_ID)).thenReturn(Optional.of(event));

        EventResponseDTO result = eventService.getEventById(EVENT_ID);

        assertThat(result.attendees()).isNull();
        assertThat(result.isRegistered()).isFalse();
    }

    @Test
    void getEventByIdReturnsAttendeesWhenViewerIsAdministrator() {
        authenticate();
        Event event = buildEvent(EVENT_ID, buildUser(CURATOR_ID, UserRole.CURADOR, "Ana", "Gomez"));
        User admin = buildUser(USER_ID, UserRole.ADMINISTRADOR, "Root", "Admin");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(admin));
        when(eventRepository.findByIdWithCurator(EVENT_ID)).thenReturn(Optional.of(event));
        when(registrationRepository.findByEventIdWithUser(EVENT_ID))
                .thenReturn(List.of(buildRegistration(buildUser(7L, UserRole.VISITANTE, "Pepe", "Lopez"))));

        EventResponseDTO result = eventService.getEventById(EVENT_ID);

        assertThat(result.attendees()).hasSize(1);
    }

    @Test
    void getEventByIdReturnsAttendeesWhenViewerIsTheLeadCurator() {
        authenticate();
        User leadCurator = buildUser(USER_ID, UserRole.CURADOR, "Ana", "Gomez");
        Event event = buildEvent(EVENT_ID, leadCurator);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(leadCurator));
        when(eventRepository.findByIdWithCurator(EVENT_ID)).thenReturn(Optional.of(event));
        when(registrationRepository.findByEventIdWithUser(EVENT_ID)).thenReturn(List.of());

        EventResponseDTO result = eventService.getEventById(EVENT_ID);

        assertThat(result.attendees()).isEmpty();
        verify(registrationRepository).findByEventIdWithUser(EVENT_ID);
    }

    @Test
    void createEventSavesAndReturnsDetailWhenCuratorIsValid() {
        when(userRepository.findById(CURATOR_ID)).thenReturn(Optional.of(buildUser(CURATOR_ID, UserRole.CURADOR, "Ana", "Gomez")));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> {
            Event saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", EVENT_ID);
            return saved;
        });

        EventResponseDTO result = eventService.createEvent(buildRequest(CURATOR_ID));

        assertThat(result.id()).isEqualTo(EVENT_ID);
        assertThat(result.title()).isEqualTo("Noche de Gala");
        assertThat(result.leadCuratorId()).isEqualTo(CURATOR_ID);
        verify(eventRepository).save(any(Event.class));
    }

    @Test
    void createEventThrowsNotFoundAndDoesNotSaveWhenCuratorDoesNotExist() {
        when(userRepository.findById(CURATOR_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.createEvent(buildRequest(CURATOR_ID)))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Usuario no encontrado con ID: " + CURATOR_ID);
                });
        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void createEventThrowsBadRequestAndDoesNotSaveWhenCuratorRoleIsInvalid() {
        when(userRepository.findById(CURATOR_ID)).thenReturn(Optional.of(buildUser(CURATOR_ID, UserRole.VISITANTE, "Pepe", "Lopez")));

        assertThatThrownBy(() -> eventService.createEvent(buildRequest(CURATOR_ID)))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessage())
                            .isEqualTo("El usuario asignado como curador a cargo debe tener rol CURADOR o ADMINISTRADOR");
                });
        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void updateEventUpdatesFieldsAndSavesWhenValid() {
        Event event = buildEvent(EVENT_ID, buildUser(CURATOR_ID, UserRole.CURADOR, "Ana", "Gomez"));
        when(eventRepository.findByIdWithCurator(EVENT_ID)).thenReturn(Optional.of(event));
        when(userRepository.findById(CURATOR_ID)).thenReturn(Optional.of(buildUser(CURATOR_ID, UserRole.CURADOR, "Ana", "Gomez")));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventResponseDTO result = eventService.updateEvent(EVENT_ID, buildRequest(CURATOR_ID));

        assertThat(result.id()).isEqualTo(EVENT_ID);
        assertThat(event.getTitle()).isEqualTo("Noche de Gala");
        verify(eventRepository).save(event);
    }

    @Test
    void updateEventThrowsNotFoundAndDoesNotLookUpCuratorWhenEventDoesNotExist() {
        when(eventRepository.findByIdWithCurator(EVENT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.updateEvent(EVENT_ID, buildRequest(CURATOR_ID)))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Evento no encontrado con ID: " + EVENT_ID);
                });
        verifyNoInteractions(userRepository);
    }

    @Test
    void updateEventThrowsNotFoundWhenCuratorDoesNotExist() {
        Event event = buildEvent(EVENT_ID, buildUser(CURATOR_ID, UserRole.CURADOR, "Ana", "Gomez"));
        when(eventRepository.findByIdWithCurator(EVENT_ID)).thenReturn(Optional.of(event));
        when(userRepository.findById(CURATOR_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.updateEvent(EVENT_ID, buildRequest(CURATOR_ID)))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Usuario no encontrado con ID: " + CURATOR_ID);
                });
        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void updateEventThrowsBadRequestWhenCuratorRoleIsInvalid() {
        Event event = buildEvent(EVENT_ID, buildUser(CURATOR_ID, UserRole.CURADOR, "Ana", "Gomez"));
        when(eventRepository.findByIdWithCurator(EVENT_ID)).thenReturn(Optional.of(event));
        when(userRepository.findById(CURATOR_ID)).thenReturn(Optional.of(buildUser(CURATOR_ID, UserRole.VISITANTE, "Pepe", "Lopez")));

        assertThatThrownBy(() -> eventService.updateEvent(EVENT_ID, buildRequest(CURATOR_ID)))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessage())
                            .isEqualTo("El usuario asignado como curador a cargo debe tener rol CURADOR o ADMINISTRADOR");
                });
    }

    @Test
    void deleteEventDeletesWhenItExists() {
        when(eventRepository.existsById(EVENT_ID)).thenReturn(true);

        eventService.deleteEvent(EVENT_ID);

        verify(eventRepository).deleteById(EVENT_ID);
    }

    @Test
    void deleteEventThrowsNotFoundAndDoesNotDeleteWhenItDoesNotExist() {
        when(eventRepository.existsById(EVENT_ID)).thenReturn(false);

        assertThatThrownBy(() -> eventService.deleteEvent(EVENT_ID))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Evento no encontrado con ID: " + EVENT_ID);
                });
        verify(eventRepository, never()).deleteById(any());
    }

    private void authenticate() {
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(EMAIL, null, List.of()));
    }

    private EventFilterRequestDTO buildFilter(LocalDate startDate, LocalDate endDate) {
        EventFilterRequestDTO filter = new EventFilterRequestDTO();
        filter.setStartDate(startDate);
        filter.setEndDate(endDate);
        return filter;
    }

    private EventRequestDTO buildRequest(Long curatorId) {
        EventRequestDTO request = new EventRequestDTO();
        request.setTitle("Noche de Gala");
        request.setDescription("desc");
        request.setDatetime(LocalDateTime.now().plusDays(1));
        request.setDuration(120);
        request.setLeadCuratorId(curatorId);
        request.setMaximumCapacity(50);
        request.setEventType(EventType.VISITA_GUIADA);
        return request;
    }

    private Event buildEvent(Long id, User leadCurator) {
        Event event = Event.of(
                "Noche de Gala",
                "desc",
                LocalDateTime.now().plusDays(1),
                120,
                leadCurator,
                50,
                EventType.VISITA_GUIADA);
        ReflectionTestUtils.setField(event, "id", id);
        return event;
    }

    private EventRegistration buildRegistration(User user) {
        return EventRegistration.of(buildEvent(EVENT_ID, null), user);
    }

    private User buildUser(Long id, UserRole role, String firstName, String lastName) {
        User user = User.of(EMAIL, "secret", role, firstName, lastName);
        if (id != null) {
            ReflectionTestUtils.setField(user, "id", id);
        }
        return user;
    }
}
