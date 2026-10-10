package com.tp_distribuidos.backend_rest.dtos;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.tp_distribuidos.backend_rest.enums.EventType;
import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@EqualsAndHashCode
public class EventFilterConfigDTO {

    private final EventType type;

    private final Long curatorId;

    private final LocalDate startDate;

    private final LocalDate endDate;

    @JsonCreator
    public EventFilterConfigDTO(@JsonProperty("type") EventType type,
                                @JsonProperty("curatorId") Long curatorId,
                                @JsonProperty("startDate") LocalDate startDate,
                                @JsonProperty("endDate") LocalDate endDate) {
        this.type = type;
        this.curatorId = curatorId;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public static EventFilterConfigDTO of(EventType type, Long curatorId,
                                          LocalDate startDate, LocalDate endDate) {
        return new EventFilterConfigDTO(type, curatorId, startDate, endDate);
    }
}
