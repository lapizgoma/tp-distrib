package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.AttendanceReportFilterRequestDTO;
import com.tp_distribuidos.backend_rest.enums.EventStatus;
import com.tp_distribuidos.backend_rest.enums.EventType;
import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.exceptions.ApiException;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import com.tp_distribuidos.backend_rest.models.entities.User;
import com.tp_distribuidos.backend_rest.reports.AttendanceReportExcelWriter;
import com.tp_distribuidos.backend_rest.reports.AttendanceReportRowDTO;
import com.tp_distribuidos.backend_rest.repositories.EventRegistrationRepository;
import com.tp_distribuidos.backend_rest.repositories.EventRegistrationRepository.EventRegistrationCount;
import com.tp_distribuidos.backend_rest.repositories.EventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    private static final String EMAIL = "ana@museo.com";
    private static final Long CURATOR_ID = 2L;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventRegistrationRepository registrationRepository;

    @Mock
    private AttendanceReportExcelWriter excelWriter;

    @InjectMocks
    private ReportService reportService;

    @Test
    void throwsBadRequestWhenStartDateIsAfterEndDate() {
        AttendanceReportFilterRequestDTO filter = buildFilter(EventStatus.ALL, null,
                LocalDate.of(2026, 12, 31), LocalDate.of(2026, 1, 1));

        assertThatThrownBy(() -> reportService.generateAttendanceReport(filter))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessage()).isEqualTo("La fecha 'startDate' no puede ser posterior a 'endDate'");
                });
        verifyNoInteractions(eventRepository, registrationRepository, excelWriter);
    }

    @Test
    void acceptsEqualsStartAndEndDates() {
        AttendanceReportFilterRequestDTO filter = buildFilter(EventStatus.ALL, null,
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 1));

        Map<EventType, List<AttendanceReportRowDTO>> rows = captureRows(filter, List.of(), List.of());

        assertThat(rows).isEmpty();
    }

    @Test
    void acceptsNullFilter() {
        when(registrationRepository.countByEventGrouped()).thenReturn(List.of());
        when(eventRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of());
        byte[] expected = {1, 2, 3};
        when(excelWriter.write(anyMap())).thenReturn(expected);

        byte[] result = reportService.generateAttendanceReport(null);

        assertThat(result).isEqualTo(expected);
    }

    @Test
    void statusAllIncludesEveryEvent() {
        Event past = buildEvent(1L, "Pasado", LocalDateTime.now().minusDays(1), 60, 10, EventType.VISITA_GUIADA);
        Event future = buildEvent(2L, "Futuro", LocalDateTime.now().plusDays(1), 60, 10, EventType.VISITA_GUIADA);

        Map<EventType, List<AttendanceReportRowDTO>> rows =
                captureRows(buildFilter(EventStatus.ALL, null, null, null), List.of(past, future), List.of());

        assertThat(rows.get(EventType.VISITA_GUIADA)).hasSize(2);
    }

    @Test
    void nullStatusIncludesEveryEvent() {
        Event past = buildEvent(1L, "Pasado", LocalDateTime.now().minusDays(1), 60, 10, EventType.VISITA_GUIADA);

        Map<EventType, List<AttendanceReportRowDTO>> rows =
                captureRows(buildFilter(null, null, null, null), List.of(past), List.of());

        assertThat(rows.get(EventType.VISITA_GUIADA)).hasSize(1);
    }

    @Test
    void statusUpcomingIncludesFutureAndExcludesPast() {
        Event past = buildEvent(1L, "Pasado", LocalDateTime.now().minusDays(1), 60, 10, EventType.VISITA_GUIADA);
        Event future = buildEvent(2L, "Futuro", LocalDateTime.now().plusDays(1), 60, 10, EventType.VISITA_GUIADA);

        Map<EventType, List<AttendanceReportRowDTO>> rows =
                captureRows(buildFilter(EventStatus.UPCOMING, null, null, null), List.of(past, future), List.of());

        assertThat(rows.get(EventType.VISITA_GUIADA))
                .extracting(AttendanceReportRowDTO::title)
                .containsExactly("Futuro");
    }

    @Test
    void statusEndedIncludesPastAndExcludesFuture() {
        Event ended = buildEvent(1L, "Terminado", LocalDateTime.now().minusHours(2), 60, 10, EventType.VISITA_GUIADA);
        Event future = buildEvent(2L, "Futuro", LocalDateTime.now().plusDays(1), 60, 10, EventType.VISITA_GUIADA);

        Map<EventType, List<AttendanceReportRowDTO>> rows =
                captureRows(buildFilter(EventStatus.ENDED, null, null, null), List.of(ended, future), List.of());

        assertThat(rows.get(EventType.VISITA_GUIADA))
                .extracting(AttendanceReportRowDTO::title)
                .containsExactly("Terminado");
    }

    @Test
    void statusEndedTreatsNullDurationAsZero() {
        Event ended = buildEvent(1L, "Terminado", LocalDateTime.now().minusHours(1), null, 10, EventType.VISITA_GUIADA);

        Map<EventType, List<AttendanceReportRowDTO>> rows =
                captureRows(buildFilter(EventStatus.ENDED, null, null, null), List.of(ended), List.of());

        assertThat(rows.get(EventType.VISITA_GUIADA)).hasSize(1);
    }

    @Test
    void statusEndedExcludesOngoingEvent() {
        Event ongoing = buildEvent(1L, "En curso", LocalDateTime.now().minusMinutes(10), 60, 10, EventType.VISITA_GUIADA);

        Map<EventType, List<AttendanceReportRowDTO>> rows =
                captureRows(buildFilter(EventStatus.ENDED, null, null, null), List.of(ongoing), List.of());

        assertThat(rows).doesNotContainKey(EventType.VISITA_GUIADA);
    }

    @Test
    void groupsRowsByEventType() {
        Event guided = buildEvent(1L, "Guia", LocalDateTime.now().minusDays(1), 60, 10, EventType.VISITA_GUIADA);
        Event workshop = buildEvent(2L, "Taller", LocalDateTime.now().minusDays(1), 60, 10, EventType.TALLER);

        Map<EventType, List<AttendanceReportRowDTO>> rows =
                captureRows(buildFilter(EventStatus.ALL, null, null, null), List.of(guided, workshop), List.of());

        assertThat(rows).containsOnlyKeys(EventType.VISITA_GUIADA, EventType.TALLER);
        assertThat(rows.get(EventType.VISITA_GUIADA)).extracting(AttendanceReportRowDTO::title).containsExactly("Guia");
        assertThat(rows.get(EventType.TALLER)).extracting(AttendanceReportRowDTO::title).containsExactly("Taller");
    }

    @Test
    void computesOccupancyRateFromRegistrations() {
        Event event = buildEvent(1L, "Guia", LocalDateTime.now().minusDays(1), 60, 10, EventType.VISITA_GUIADA);

        Map<EventType, List<AttendanceReportRowDTO>> rows =
                captureRows(buildFilter(EventStatus.ALL, null, null, null), List.of(event), List.of(count(1L, 4L)));

        AttendanceReportRowDTO row = rows.get(EventType.VISITA_GUIADA).get(0);
        assertThat(row.registered()).isEqualTo(4L);
        assertThat(row.maxCapacity()).isEqualTo(10);
        assertThat(row.occupancyRate()).isEqualTo(0.4);
    }

    @Test
    void occupancyRateIsZeroWhenMaximumCapacityIsNull() {
        Event event = buildEvent(1L, "Guia", LocalDateTime.now().minusDays(1), 60, null, EventType.VISITA_GUIADA);

        Map<EventType, List<AttendanceReportRowDTO>> rows =
                captureRows(buildFilter(EventStatus.ALL, null, null, null), List.of(event), List.of(count(1L, 4L)));

        assertThat(rows.get(EventType.VISITA_GUIADA).get(0).occupancyRate()).isEqualTo(0.0);
    }

    @Test
    void occupancyRateIsZeroWhenMaximumCapacityIsZero() {
        Event event = buildEvent(1L, "Guia", LocalDateTime.now().minusDays(1), 60, 0, EventType.VISITA_GUIADA);

        Map<EventType, List<AttendanceReportRowDTO>> rows =
                captureRows(buildFilter(EventStatus.ALL, null, null, null), List.of(event), List.of(count(1L, 4L)));

        assertThat(rows.get(EventType.VISITA_GUIADA).get(0).occupancyRate()).isEqualTo(0.0);
    }

    @Test
    void registeredDefaultsToZeroWhenThereIsNoRegistrationCount() {
        Event event = buildEvent(1L, "Guia", LocalDateTime.now().minusDays(1), 60, 10, EventType.VISITA_GUIADA);

        Map<EventType, List<AttendanceReportRowDTO>> rows =
                captureRows(buildFilter(EventStatus.ALL, null, null, null), List.of(event), List.of());

        assertThat(rows.get(EventType.VISITA_GUIADA).get(0).registered()).isEqualTo(0L);
    }

    @Test
    void resolvesCuratorNameFromFirstAndLastName() {
        Event event = buildEvent(1L, "Guia", LocalDateTime.now().minusDays(1), 60, 10, EventType.VISITA_GUIADA,
                buildCurator("Ana", "Gomez"));

        Map<EventType, List<AttendanceReportRowDTO>> rows =
                captureRows(buildFilter(EventStatus.ALL, null, null, null), List.of(event), List.of());

        assertThat(rows.get(EventType.VISITA_GUIADA).get(0).curator()).isEqualTo("Ana Gomez");
    }

    @Test
    void resolvesCuratorNameFallingBackToEmailWhenNamesAreBlank() {
        Event event = buildEvent(1L, "Guia", LocalDateTime.now().minusDays(1), 60, 10, EventType.VISITA_GUIADA,
                buildCurator("", ""));

        Map<EventType, List<AttendanceReportRowDTO>> rows =
                captureRows(buildFilter(EventStatus.ALL, null, null, null), List.of(event), List.of());

        assertThat(rows.get(EventType.VISITA_GUIADA).get(0).curator()).isEqualTo(EMAIL);
    }

    @Test
    void delegatesRenderToExcelWriterAndReturnsItsBytes() {
        Event event = buildEvent(1L, "Guia", LocalDateTime.now().minusDays(1), 60, 10, EventType.VISITA_GUIADA);
        byte[] expected = {7, 7, 7};
        when(registrationRepository.countByEventGrouped()).thenReturn(List.of());
        when(eventRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of(event));
        when(excelWriter.write(anyMap())).thenReturn(expected);

        byte[] result = reportService.generateAttendanceReport(buildFilter(EventStatus.ALL, null, null, null));

        assertThat(result).isEqualTo(expected);
        verify(excelWriter).write(anyMap());
    }

    @SuppressWarnings("unchecked")
    private Map<EventType, List<AttendanceReportRowDTO>> captureRows(AttendanceReportFilterRequestDTO filter,
                                                                     List<Event> events,
                                                                     List<EventRegistrationCount> counts) {
        when(registrationRepository.countByEventGrouped()).thenReturn(counts);
        when(eventRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(events);
        when(excelWriter.write(anyMap())).thenReturn(new byte[]{9});

        ArgumentCaptor<Map<EventType, List<AttendanceReportRowDTO>>> captor =
                ArgumentCaptor.forClass(Map.class);
        reportService.generateAttendanceReport(filter);
        verify(excelWriter).write(captor.capture());
        return captor.getValue();
    }

    private AttendanceReportFilterRequestDTO buildFilter(EventStatus status, EventType type,
                                                         LocalDate startDate, LocalDate endDate) {
        AttendanceReportFilterRequestDTO filter = new AttendanceReportFilterRequestDTO();
        filter.setStatus(status);
        filter.setType(type);
        filter.setStartDate(startDate);
        filter.setEndDate(endDate);
        return filter;
    }

    private Event buildEvent(Long id, String title, LocalDateTime datetime, Integer duration,
                             Integer maximumCapacity, EventType eventType) {
        return buildEvent(id, title, datetime, duration, maximumCapacity, eventType, buildCurator("Ana", "Gomez"));
    }

    private Event buildEvent(Long id, String title, LocalDateTime datetime, Integer duration,
                             Integer maximumCapacity, EventType eventType, User curator) {
        Event event = Event.of(title, "desc", datetime, duration, curator, maximumCapacity, eventType);
        ReflectionTestUtils.setField(event, "id", id);
        return event;
    }

    private User buildCurator(String firstName, String lastName) {
        User curator = User.of(EMAIL, "secret", UserRole.CURADOR, firstName, lastName);
        ReflectionTestUtils.setField(curator, "id", CURATOR_ID);
        return curator;
    }

    private EventRegistrationCount count(Long eventId, Long total) {
        return new EventRegistrationCount() {
            @Override
            public Long getEventId() {
                return eventId;
            }

            @Override
            public Long getTotal() {
                return total;
            }
        };
    }
}
