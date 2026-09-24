package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.EventType;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import com.tp_distribuidos.backend_rest.models.entities.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class EventResponseDTO {

    @Schema(example = "1")
    private Long id;

    @Schema(example = "Noche de Gala en el Museo")
    private String title;

    @Schema(example = "Recorrido nocturno guiado con música en vivo.")
    private String description;

    @Schema(example = "2026-11-15T20:00:00")
    private LocalDateTime datetime;

    @Schema(example = "120")
    private Integer duration;

    @Schema(example = "2")
    private Long leadCuratorId;

    @Schema(example = "Ana Gómez")
    private String leadCuratorName;

    @Schema(example = "50")
    private Integer maximumCapacity;

    @Schema(example = "VISITA_GUIADA")
    private EventType eventType;

    public static EventResponseDTO fromEntity(Event event) {
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

        return EventResponseDTO.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .datetime(event.getDatetime())
                .duration(event.getDuration())
                .leadCuratorId(curatorId)
                .leadCuratorName(curatorFullName)
                .maximumCapacity(event.getMaximumCapacity())
                .eventType(event.getEventType())
                .build();
    }
}