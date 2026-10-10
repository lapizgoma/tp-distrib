package com.tp_distribuidos.backend_rest.specifications;

import com.tp_distribuidos.backend_rest.dtos.AttendanceReportFilterRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.EventFilterRequestDTO;
import com.tp_distribuidos.backend_rest.enums.EventType;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Specifications de {@link Event} usadas para construir consultas dinámicas.
 *
 * <p>Una {@link Specification} es una forma funcional de describir el {@code WHERE} de una
 * consulta JPA: en lugar de escribir una query fija por cada combinación de filtros, se arma
 * el predicado en tiempo de ejecución. Esto permite que el endpoint de listado exponga
 * filtros opcionales sin multiplicar métodos en el repositorio.</p>
 *
 * <p>Esta clase es una utilidad sin estado: no se instancia. Sus métodos devuelven una
 * {@code Specification} que el repositorio aplica junto con el ordenamiento deseado.</p>
 */
public final class EventSpecifications {

    private EventSpecifications() {
    }

    /**
     * Construye una {@link Specification} de {@link Event} a partir de los filtros de listado
     * de eventos.
     *
     * <p>Cada criterio se agrega únicamente si su valor es distinto de {@code null}, por lo que
     * cualquier combinación de filtros es válida. Si el filtro es {@code null} o todos sus
     * campos están vacíos, se retorna una conjunción vacía ({@code cb.and()} sin predicados),
     * que equivale a "sin restricciones": se listan todos los eventos, futuros y pasados.</p>
     *
     * <p>Semántica de los filtros:</p>
     * <ul>
     *     <li>{@code type}: igualdad con el tipo de evento.</li>
     *     <li>{@code curatorId}: igualdad con el ID del curador a cargo ({@code leadCurator}).</li>
     *     <li>{@code startDate}: fecha del evento mayor o igual a la indicada (inclusive).</li>
     *     <li>{@code endDate}: fecha del evento estrictamente anterior a la indicada (exclusiva).</li>
     * </ul>
     *
     * <p>La validación de que {@code startDate} no sea posterior a {@code endDate} no se
     * realiza aquí, sino en la capa de servicio, ya que es una regla de negocio y no parte
     * de la construcción del predicado.</p>
     *
     * @param filter filtros opcionales; puede ser {@code null}
     * @return una {@code Specification} lista para combinarse o ejecutarse
     */
    public static Specification<Event> withFilters(EventFilterRequestDTO filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter != null) {
                addCommonPredicates(predicates, root, cb, filter.getType(), filter.getStartDate(), filter.getEndDate());
                if (filter.getCuratorId() != null) {
                    predicates.add(cb.equal(root.get("leadCurator").get("id"), filter.getCuratorId()));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Construye una {@link Specification} de {@link Event} a partir de los filtros del
     * informe de asistencia.
     *
     * <p>Comparte con {@link #withFilters(EventFilterRequestDTO)} los predicados de tipo y
     * rango de fechas ({@code startDate} inclusiva, {@code endDate} exclusiva), de modo que
     * ambos endpoints no puedan divergir en su semántica. La única diferencia es que aquí no
     * se filtra por curador.</p>
     *
     * <p>El filtro de estado ({@code status}) no se resuelve aquí: depende del momento
     * actual y de la duración del evento ({@code datetime + duration}), por lo que se
     * aplica en la capa de servicio.</p>
     *
     * @param filter filtros opcionales; puede ser {@code null}
     * @return una {@code Specification} lista para ejecutarse
     */
    public static Specification<Event> withReportFilters(AttendanceReportFilterRequestDTO filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter != null) {
                addCommonPredicates(predicates, root, cb, filter.getType(), filter.getStartDate(), filter.getEndDate());
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Agrega los predicados compartidos por todos los filtros de eventos: tipo, fecha desde
     * (inclusive) y fecha hasta (exclusiva). Centralizar esta lógica garantiza que las
     * distintas superficies de filtrado mantengan la misma semántica.
     */
    private static void addCommonPredicates(List<Predicate> predicates, Root<Event> root, CriteriaBuilder cb,
                                            EventType type, LocalDate startDate, LocalDate endDate) {
        if (type != null) {
            predicates.add(cb.equal(root.get("eventType"), type));
        }
        if (startDate != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("datetime"), startDate.atStartOfDay()));
        }
        if (endDate != null) {
            predicates.add(cb.lessThan(root.get("datetime"), endDate.atStartOfDay()));
        }
    }
}
