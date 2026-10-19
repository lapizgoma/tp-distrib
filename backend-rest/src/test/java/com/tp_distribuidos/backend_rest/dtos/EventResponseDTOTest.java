package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.EventType;
import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import com.tp_distribuidos.backend_rest.models.entities.User;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EventResponseDTOTest {

    private static final String EMAIL = "ana@museo.com";
    private static final Long EVENT_ID = 12L;
    private static final Long CURATOR_ID = 2L;
    private static final LocalDateTime DATETIME = LocalDateTime.of(2026, 11, 15, 20, 0);

    @Test
    void mapsAllEventFieldsFromEntity() {
        Event event = buildEvent(buildCurator("Ana", "Gomez"));

        EventResponseDTO dto = EventResponseDTO.fromEntity(event);

        assertThat(dto.id()).isEqualTo(EVENT_ID);
        assertThat(dto.title()).isEqualTo("Noche de Gala");
        assertThat(dto.description()).isEqualTo("desc");
        assertThat(dto.datetime()).isEqualTo(DATETIME);
        assertThat(dto.duration()).isEqualTo(120);
        assertThat(dto.leadCuratorId()).isEqualTo(CURATOR_ID);
        assertThat(dto.leadCuratorName()).isEqualTo("Ana Gomez");
        assertThat(dto.maximumCapacity()).isEqualTo(50);
        assertThat(dto.eventType()).isEqualTo(EventType.VISITA_GUIADA);
    }

    @Test
    void resolvesCuratorNameFallingBackToEmailWhenNamesAreBlank() {
        Event event = buildEvent(buildCurator("", ""));

        EventResponseDTO dto = EventResponseDTO.fromEntity(event);

        assertThat(dto.leadCuratorName()).isEqualTo(EMAIL);
    }

    @Test
    void returnsNullCuratorIdAndNameWhenEventHasNoLeadCurator() {
        Event event = buildEvent(null);

        EventResponseDTO dto = EventResponseDTO.fromEntity(event);

        assertThat(dto.leadCuratorId()).isNull();
        assertThat(dto.leadCuratorName()).isNull();
    }

    @Test
    void usesNullAttendeesWhenBuiltWithoutThem() {
        Event event = buildEvent(buildCurator("Ana", "Gomez"));

        EventResponseDTO dto = EventResponseDTO.fromEntity(event);

        assertThat(dto.attendees()).isNull();
        assertThat(dto.isRegistered()).isNull();
    }

    @Test
    void passesThroughProvidedAttendees() {
        Event event = buildEvent(buildCurator("Ana", "Gomez"));
        List<EventAttendeeDTO> attendees = List.of(
                new EventAttendeeDTO(7L, "Pepe Lopez", "pepe@museo.com", DATETIME));

        EventResponseDTO dto = EventResponseDTO.fromEntity(event, attendees);

        assertThat(dto.attendees()).isSameAs(attendees);
    }

    @Test
    void defaultsIsRegisteredToNullWhenNotProvided() {
        Event event = buildEvent(buildCurator("Ana", "Gomez"));

        EventResponseDTO dto = EventResponseDTO.fromEntity(event, List.of());

        assertThat(dto.isRegistered()).isNull();
    }

    @Test
    void passesThroughProvidedIsRegistered() {
        Event event = buildEvent(buildCurator("Ana", "Gomez"));

        EventResponseDTO dto = EventResponseDTO.fromEntity(event, List.of(), true);

        assertThat(dto.isRegistered()).isTrue();
    }

    private Event buildEvent(User leadCurator) {
        Event event = Event.of("Noche de Gala", "desc", DATETIME, 120, leadCurator, 50, EventType.VISITA_GUIADA);
        ReflectionTestUtils.setField(event, "id", EVENT_ID);
        return event;
    }

    private User buildCurator(String firstName, String lastName) {
        User curator = User.of(EMAIL, "secret", UserRole.CURADOR, firstName, lastName);
        ReflectionTestUtils.setField(curator, "id", CURATOR_ID);
        return curator;
    }
}
