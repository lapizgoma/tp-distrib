package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.EventFieldChangeDTO;
import com.tp_distribuidos.backend_rest.dtos.EventSnapshotDTO;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Compara dos snapshots de evento y devuelve únicamente los campos cambiados.
 */
public final class EventChangeDetector {

    private EventChangeDetector() {
    }

    public static Map<String, EventFieldChangeDTO> diff(EventSnapshotDTO previous,
                                                        EventSnapshotDTO current) {
        Map<String, EventFieldChangeDTO> changes = new LinkedHashMap<>();
        addIfChanged(changes, "eventTitle", previous.eventTitle(), current.eventTitle());
        addIfChanged(changes, "description", previous.description(), current.description());
        addIfChanged(changes, "eventDateTime", previous.eventDateTime(), current.eventDateTime());
        addIfChanged(changes, "duration", previous.duration(), current.duration());
        addIfChanged(changes, "leadCuratorId", previous.leadCuratorId(), current.leadCuratorId());
        addIfChanged(changes, "maximumCapacity", previous.maximumCapacity(), current.maximumCapacity());
        addIfChanged(changes, "eventType", previous.eventType(), current.eventType());
        return changes;
    }

    private static void addIfChanged(Map<String, EventFieldChangeDTO> changes,
                                     String field,
                                     Object previousValue,
                                     Object currentValue) {
        if (!Objects.equals(previousValue, currentValue)) {
            changes.put(field, new EventFieldChangeDTO(previousValue, currentValue));
        }
    }
}
