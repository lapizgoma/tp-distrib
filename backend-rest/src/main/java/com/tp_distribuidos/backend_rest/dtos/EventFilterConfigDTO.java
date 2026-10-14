package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.EventType;

import java.time.LocalDate;

public record EventFilterConfigDTO(
        EventType type,
        Long curatorId,
        LocalDate startDate,
        LocalDate endDate
) {

    public static EventFilterConfigDTO of(EventType type, Long curatorId,
                                          LocalDate startDate, LocalDate endDate) {
        return new EventFilterConfigDTO(type, curatorId, startDate, endDate);
    }
}
