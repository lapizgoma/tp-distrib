package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.EventType;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import com.tp_distribuidos.backend_rest.models.entities.User;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

public record EventResponseDTO(

        @Schema(example = "1")
        Long id,

        @Schema(example = "Noche de Gala en el Museo")
        String title,

        @Schema(example = "Recorrido nocturno guiado con música en vivo.")
        String description,

        @Schema(example = "2026-11-15T20:00:00")
        LocalDateTime datetime,

        @Schema(example = "120")
        Integer duration,

        @Schema(example = "2")
        Long leadCuratorId,

        @Schema(example = "Ana Gómez")
        String leadCuratorName,

        @Schema(example = "50")
        Integer maximumCapacity,

        @Schema(example = "VISITA_GUIADA")
        EventType eventType,

        @Schema(description = "Lista de inscriptos; null si el viewer no tiene permiso, [] si tiene permiso y no hay inscriptos")
        List<EventAttendeeDTO> attendees
) {

    public static EventResponseDTO fromEntity(Event event) {
        return fromEntity(event, null);
    }

    public static EventResponseDTO fromEntity(Event event, List<EventAttendeeDTO> attendees) {
        String curatorFullName = null;
        Long curatorId = null;

        if (event.getLeadCurator() != null) {
            User curator = event.getLeadCurator();
            curatorId = curator.getId();

            String firstName = curator.getFirstName() != null ? curator.getFirstName() : "";
            String lastName = curator.getLastName() != null ? curator.getLastName() : "";
            curatorFullName = (firstName + " " + lastName).trim();

            if (curatorFullName.isEmpty()) {
                curatorFullName = curator.getEmail();
            }
        }

        return new EventResponseDTO(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getDatetime(),
                event.getDuration(),
                curatorId,
                curatorFullName,
                event.getMaximumCapacity(),
                event.getEventType(),
                attendees);
    }
}
