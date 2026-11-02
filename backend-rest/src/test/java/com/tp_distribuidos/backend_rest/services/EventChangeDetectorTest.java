package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.EventFieldChangeDTO;
import com.tp_distribuidos.backend_rest.dtos.EventSnapshotDTO;
import com.tp_distribuidos.backend_rest.enums.EventType;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class EventChangeDetectorTest {

    private static final LocalDateTime EVENT_DATETIME = LocalDateTime.of(2026, 11, 15, 20, 0);

    @Test
    void returnsEmptyMapWhenSnapshotsAreEqual() {
        EventSnapshotDTO snapshot = snapshot("Noche de Gala", "desc", EVENT_DATETIME, 120, 2L, 50, EventType.VISITA_GUIADA);

        Map<String, EventFieldChangeDTO> changes = EventChangeDetector.diff(snapshot, snapshot);

        assertThat(changes).isEmpty();
    }

    @Test
    void returnsOnlyChangedFieldsWithPreviousAndCurrentValues() {
        EventSnapshotDTO previous = snapshot("Noche de Gala", "desc", EVENT_DATETIME, 120, 2L, 50, EventType.VISITA_GUIADA);
        LocalDateTime newDatetime = EVENT_DATETIME.plusDays(1);
        EventSnapshotDTO current = snapshot("Noche de Gala Actualizada", "desc", newDatetime, 120, 3L, 50, EventType.VISITA_GUIADA);

        Map<String, EventFieldChangeDTO> changes = EventChangeDetector.diff(previous, current);

        assertThat(changes).containsOnlyKeys("eventTitle", "eventDateTime", "leadCuratorId");
        assertThat(changes.get("eventTitle"))
                .isEqualTo(new EventFieldChangeDTO("Noche de Gala", "Noche de Gala Actualizada"));
        assertThat(changes.get("eventDateTime"))
                .isEqualTo(new EventFieldChangeDTO(EVENT_DATETIME, newDatetime));
        assertThat(changes.get("leadCuratorId"))
                .isEqualTo(new EventFieldChangeDTO(2L, 3L));
    }

    @Test
    void detectsChangesFromNullToValueAndValueToNull() {
        EventSnapshotDTO previous = snapshot("Noche de Gala", null, EVENT_DATETIME, null, 2L, 50, EventType.VISITA_GUIADA);
        EventSnapshotDTO current = snapshot("Noche de Gala", "nueva desc", EVENT_DATETIME, 90, 2L, 50, EventType.VISITA_GUIADA);

        Map<String, EventFieldChangeDTO> changes = EventChangeDetector.diff(previous, current);

        assertThat(changes).containsOnlyKeys("description", "duration");
        assertThat(changes.get("description")).isEqualTo(new EventFieldChangeDTO(null, "nueva desc"));
        assertThat(changes.get("duration")).isEqualTo(new EventFieldChangeDTO(null, 90));
    }

    private EventSnapshotDTO snapshot(String title, String description, LocalDateTime datetime,
                                      Integer duration, Long leadCuratorId, Integer maximumCapacity,
                                      EventType eventType) {
        return new EventSnapshotDTO(
                title,
                description,
                datetime,
                duration,
                leadCuratorId,
                maximumCapacity,
                eventType
        );
    }
}
