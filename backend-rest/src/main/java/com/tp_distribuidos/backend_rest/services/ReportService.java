package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.enums.EventType;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import com.tp_distribuidos.backend_rest.models.entities.User;
import com.tp_distribuidos.backend_rest.reports.AttendanceReportExcelWriter;
import com.tp_distribuidos.backend_rest.reports.AttendanceReportRowDTO;
import com.tp_distribuidos.backend_rest.repositories.EventRegistrationRepository;
import com.tp_distribuidos.backend_rest.repositories.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Servicio que reúne los datos del informe de asistencia a eventos y delega su
 * render en {@link AttendanceReportExcelWriter}.
 *
 * <p>La generación del archivo no ocurre dentro de una transacción: la consulta de
 * datos y la escritura del Excel quedan desacopladas. Cada consulta al repositorio
 * se ejecuta en su propia transacción de lectura, de modo que la conexión a la base
 * no permanece abierta mientras se arma el libro.</p>
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final AttendanceReportExcelWriter excelWriter;

    /**
     * Genera el informe de asistencia con una hoja por tipo de evento.
     *
     * @return el contenido binario del archivo {@code .xlsx}.
     */
    public byte[] generateAttendanceReport() {
        Map<EventType, List<AttendanceReportRowDTO>> rowsByType = collectRowsByEventType();
        return excelWriter.write(rowsByType);
    }

    private Map<EventType, List<AttendanceReportRowDTO>> collectRowsByEventType() {
        Map<Long, Long> registrationsByEvent = registrationRepository.countByEventGrouped()
                .stream()
                .collect(Collectors.toMap(
                        EventRegistrationRepository.EventRegistrationCount::getEventId,
                        EventRegistrationRepository.EventRegistrationCount::getTotal));

        return eventRepository.findAllWithCurator()
                .stream()
                .collect(Collectors.groupingBy(
                        Event::getEventType,
                        Collectors.mapping(
                                event -> toRow(event, registrationsByEvent.getOrDefault(event.getId(), 0L)),
                                Collectors.toList())));
    }

    private AttendanceReportRowDTO toRow(Event event, long registered) {
        Integer maxCapacity = event.getMaximumCapacity();
        double occupancyRate = (maxCapacity != null && maxCapacity > 0)
                ? (double) registered / maxCapacity
                : 0.0;

        return new AttendanceReportRowDTO(
                event.getDatetime(),
                event.getTitle(),
                resolveCuratorName(event.getLeadCurator()),
                registered,
                maxCapacity,
                occupancyRate);
    }

    private String resolveCuratorName(User curator) {
        String firstName = curator.getFirstName() != null ? curator.getFirstName() : "";
        String lastName = curator.getLastName() != null ? curator.getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();

        return fullName.isEmpty() ? curator.getEmail() : fullName;
    }
}
