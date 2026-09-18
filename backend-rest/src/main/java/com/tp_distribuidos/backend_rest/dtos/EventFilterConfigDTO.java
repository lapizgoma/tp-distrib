package com.tp_distribuidos.backend_rest.dtos;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.tp_distribuidos.backend_rest.enums.EventType;
import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@EqualsAndHashCode
public class EventFilterConfigDTO {

    private final EventType eventType;

    private final Long curadorId;

    private final LocalDateTime fechaDesde;

    private final LocalDateTime fechaHasta;

    @JsonCreator
    public EventFilterConfigDTO(@JsonProperty("eventType") EventType eventType,
                                @JsonProperty("curadorId") Long curadorId,
                                @JsonProperty("fechaDesde") LocalDateTime fechaDesde,
                                @JsonProperty("fechaHasta") LocalDateTime fechaHasta) {
        this.eventType = eventType;
        this.curadorId = curadorId;
        this.fechaDesde = fechaDesde;
        this.fechaHasta = fechaHasta;
    }

    public static EventFilterConfigDTO of(EventType eventType, Long curadorId,
                                          LocalDateTime fechaDesde, LocalDateTime fechaHasta) {
        return new EventFilterConfigDTO(eventType, curadorId, fechaDesde, fechaHasta);
    }
}