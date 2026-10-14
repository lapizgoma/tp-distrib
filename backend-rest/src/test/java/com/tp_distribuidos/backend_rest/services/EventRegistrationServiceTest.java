package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.EventRegistrationRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.EventRegistrationResponseDTO;
import com.tp_distribuidos.backend_rest.enums.EventType;
import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.exceptions.ApiException;
import com.tp_distribuidos.backend_rest.models.embeddable.EventRegistrationId;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import com.tp_distribuidos.backend_rest.models.entities.EventRegistration;
import com.tp_distribuidos.backend_rest.models.entities.User;
import com.tp_distribuidos.backend_rest.repositories.EventRegistrationRepository;
import com.tp_distribuidos.backend_rest.repositories.EventRepository;
import com.tp_distribuidos.backend_rest.repositories.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

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
class EventRegistrationServiceTest {

    private static final String EMAIL = "ana@museo.com";
    private static final Long USER_ID = 5L;
    private static final Long EVENT_ID = 12L;

    @Mock
    private EventRegistrationRepository registrationRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EventRegistrationService registrationService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(EMAIL, null, List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void registerSavesAndReturnsDetailWhenEventHasNoCapacityLimit() {
        User user = buildUser(USER_ID);
        Event event = buildEvent(EVENT_ID, null);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));
        when(registrationRepository.existsByEventIdAndUserId(EVENT_ID, USER_ID)).thenReturn(false);
        when(registrationRepository.save(any(EventRegistration.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventRegistrationResponseDTO result = registrationService.registerMember(buildRequest());

        assertThat(result.eventId()).isEqualTo(EVENT_ID);
        assertThat(result.eventTitle()).isEqualTo("Noche de Gala");
        assertThat(result.userId()).isEqualTo(USER_ID);
        assertThat(result.userEmail()).isEqualTo(EMAIL);
        assertThat(result.registeredAt()).isNotNull();
        verify(registrationRepository, never()).countByEventId(any());
    }

    @Test
    void registerSavesWhenCapacityIsNotReached() {
        User user = buildUser(USER_ID);
        Event event = buildEvent(EVENT_ID, 10);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));
        when(registrationRepository.existsByEventIdAndUserId(EVENT_ID, USER_ID)).thenReturn(false);
        when(registrationRepository.countByEventId(EVENT_ID)).thenReturn(3L);
        when(registrationRepository.save(any(EventRegistration.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventRegistrationResponseDTO result = registrationService.registerMember(buildRequest());

        assertThat(result.eventId()).isEqualTo(EVENT_ID);
        verify(registrationRepository).countByEventId(EVENT_ID);
        verify(registrationRepository).save(any(EventRegistration.class));
    }

    @Test
    void registerBuildsCompositeIdFromEventAndUser() {
        User user = buildUser(USER_ID);
        Event event = buildEvent(EVENT_ID, null);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));
        when(registrationRepository.existsByEventIdAndUserId(EVENT_ID, USER_ID)).thenReturn(false);
        when(registrationRepository.save(any(EventRegistration.class))).thenAnswer(invocation -> invocation.getArgument(0));

        registrationService.registerMember(buildRequest());

        ArgumentCaptor<EventRegistration> captor = ArgumentCaptor.forClass(EventRegistration.class);
        verify(registrationRepository).save(captor.capture());
        EventRegistration saved = captor.getValue();
        assertThat(saved.getId().getEventId()).isEqualTo(EVENT_ID);
        assertThat(saved.getId().getUserId()).isEqualTo(USER_ID);
    }

    @Test
    void registerThrowsBadRequestWhenCapacityIsAlreadyReached() {
        User user = buildUser(USER_ID);
        Event event = buildEvent(EVENT_ID, 10);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));
        when(registrationRepository.existsByEventIdAndUserId(EVENT_ID, USER_ID)).thenReturn(false);
        when(registrationRepository.countByEventId(EVENT_ID)).thenReturn(10L);

        assertThatThrownBy(() -> registrationService.registerMember(buildRequest()))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessage()).isEqualTo("El cupo máximo del evento ha sido alcanzado (10).");
                });
        verify(registrationRepository, never()).save(any(EventRegistration.class));
    }

    @Test
    void registerThrowsBadRequestWhenUserIsAlreadyRegistered() {
        User user = buildUser(USER_ID);
        Event event = buildEvent(EVENT_ID, 10);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));
        when(registrationRepository.existsByEventIdAndUserId(EVENT_ID, USER_ID)).thenReturn(true);

        assertThatThrownBy(() -> registrationService.registerMember(buildRequest()))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessage()).isEqualTo("El usuario ya se encuentra inscripto a este evento.");
                });
        verify(registrationRepository, never()).countByEventId(any());
        verify(registrationRepository, never()).save(any(EventRegistration.class));
    }

    @Test
    void registerThrowsNotFoundAndDoesNotCheckRegistrationWhenEventDoesNotExist() {
        User user = buildUser(USER_ID);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registrationService.registerMember(buildRequest()))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Evento no encontrado con ID: " + EVENT_ID);
                });
        verify(registrationRepository, never()).existsByEventIdAndUserId(any(), any());
        verify(registrationRepository, never()).save(any(EventRegistration.class));
    }

    @Test
    void registerThrowsNotFoundAndDoesNotTouchRepositoriesWhenUserDoesNotExist() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registrationService.registerMember(buildRequest()))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Usuario autenticado no encontrado: " + EMAIL);
                });
        verifyNoInteractions(eventRepository, registrationRepository);
    }

    @Test
    void registerThrowsBadRequestWhenThereIsNoAuthentication() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> registrationService.registerMember(buildRequest()))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessage()).isEqualTo("No hay un usuario autenticado en la sesión.");
                });
        verifyNoInteractions(userRepository, eventRepository, registrationRepository);
    }

    @Test
    void registerThrowsBadRequestWhenTokenIsNotAuthenticated() {
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(EMAIL, null));

        assertThatThrownBy(() -> registrationService.registerMember(buildRequest()))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessage()).isEqualTo("No hay un usuario autenticado en la sesión.");
                });
        verifyNoInteractions(userRepository, eventRepository, registrationRepository);
    }

    @Test
    void unregisterDeletesRegistrationWhenItExists() {
        User user = buildUser(USER_ID);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(registrationRepository.existsById(new EventRegistrationId(EVENT_ID, USER_ID))).thenReturn(true);

        registrationService.unregisterMember(buildRequest());

        verify(registrationRepository).deleteById(new EventRegistrationId(EVENT_ID, USER_ID));
    }

    @Test
    void unregisterThrowsNotFoundAndDoesNotDeleteWhenThereIsNoActiveRegistration() {
        User user = buildUser(USER_ID);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(registrationRepository.existsById(new EventRegistrationId(EVENT_ID, USER_ID))).thenReturn(false);

        assertThatThrownBy(() -> registrationService.unregisterMember(buildRequest()))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage())
                            .isEqualTo("No se encontró una inscripción activa para este evento y usuario.");
                });
        verify(registrationRepository, never()).deleteById(any(EventRegistrationId.class));
    }

    @Test
    void unregisterThrowsNotFoundAndDoesNotQueryRegistrationsWhenUserDoesNotExist() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registrationService.unregisterMember(buildRequest()))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("Usuario autenticado no encontrado: " + EMAIL);
                });
        verifyNoInteractions(registrationRepository);
    }

    @Test
    void unregisterThrowsBadRequestWhenThereIsNoAuthentication() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> registrationService.unregisterMember(buildRequest()))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessage()).isEqualTo("No hay un usuario autenticado en la sesión.");
                });
        verifyNoInteractions(userRepository, registrationRepository);
    }

    private EventRegistrationRequestDTO buildRequest() {
        return new EventRegistrationRequestDTO(EVENT_ID);
    }

    private User buildUser(Long id) {
        User user = User.of(EMAIL, "secret", UserRole.VISITANTE);
        if (id != null) {
            ReflectionTestUtils.setField(user, "id", id);
        }
        return user;
    }

    private Event buildEvent(Long id, Integer maximumCapacity) {
        User curator = User.of("curator@museo.com", "secret", UserRole.CURADOR, "Ana", "Gomez");
        Event event = Event.of(
                "Noche de Gala",
                "desc",
                LocalDateTime.now().plusDays(1),
                60,
                curator,
                maximumCapacity,
                EventType.VISITA_GUIADA);
        ReflectionTestUtils.setField(event, "id", id);
        return event;
    }
}
