package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.EventType;
import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import com.tp_distribuidos.backend_rest.models.entities.EventRegistration;
import com.tp_distribuidos.backend_rest.models.entities.User;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class EventAttendeeDTOTest {

    private static final String EMAIL = "pepe@museo.com";
    private static final Long USER_ID = 7L;
    private static final Long EVENT_ID = 12L;

    @Test
    void mapsUserFieldsFromRegistration() {
        User user = buildUser(USER_ID, "Pepe", "Lopez");
        EventRegistration registration = EventRegistration.of(buildEvent(), user);

        EventAttendeeDTO dto = EventAttendeeDTO.fromEntity(registration);

        assertThat(dto.userId()).isEqualTo(USER_ID);
        assertThat(dto.name()).isEqualTo("Pepe Lopez");
        assertThat(dto.email()).isEqualTo(EMAIL);
        assertThat(dto.registeredAt()).isNotNull();
    }

    @Test
    void buildsNameFromFirstNameWhenLastNameIsNull() {
        EventRegistration registration = EventRegistration.of(buildEvent(), buildUser(USER_ID, "Pepe", null));

        EventAttendeeDTO dto = EventAttendeeDTO.fromEntity(registration);

        assertThat(dto.name()).isEqualTo("Pepe");
    }

    @Test
    void fallsBackToEmailWhenNamesAreBlank() {
        EventRegistration registration = EventRegistration.of(buildEvent(), buildUser(USER_ID, "", ""));

        EventAttendeeDTO dto = EventAttendeeDTO.fromEntity(registration);

        assertThat(dto.name()).isEqualTo(EMAIL);
    }

    @Test
    void fallsBackToEmailWhenNamesAreNull() {
        EventRegistration registration = EventRegistration.of(buildEvent(), buildUser(USER_ID, null, null));

        EventAttendeeDTO dto = EventAttendeeDTO.fromEntity(registration);

        assertThat(dto.name()).isEqualTo(EMAIL);
    }

    private Event buildEvent() {
        Event event = Event.of("Noche de Gala", "desc", LocalDateTime.now().plusDays(1), 120, null, 50,
                EventType.VISITA_GUIADA);
        ReflectionTestUtils.setField(event, "id", EVENT_ID);
        return event;
    }

    private User buildUser(Long id, String firstName, String lastName) {
        User user = User.of(EMAIL, "secret", UserRole.VISITANTE, firstName, lastName);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
