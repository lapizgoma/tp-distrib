package com.tp_distribuidos.backend_rest.specifications;

import com.tp_distribuidos.backend_rest.dtos.EventFilterRequestDTO;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

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
     * Construye una {@link Specification} de {@link Event} a partir de los filtros provistos.
     *
     * <p>Cada criterio se agrega únicamente si su valor es distinto de {@code null}, por lo que
     * cualquier combinación de filtros es válida. Si el filtro es {@code null} o todos sus
     * campos están vacíos, se retorna una conjunción vacía ({@code cb.and()} sin predicados),
     * que equivale a "sin restricciones": se listan todos los eventos, futuros y pasados.</p>
     *
     * <p>Semántica de los filtros:</p>
     * <ul>
     *     <li>{@code eventType}: igualdad con el tipo de evento.</li>
     *     <li>{@code curadorId}: igualdad con el ID del curador a cargo ({@code leadCurator}).</li>
     *     <li>{@code fechaDesde}: fecha/hora del evento mayor o igual a la indicada (inclusive).</li>
     *     <li>{@code fechaHasta}: fecha/hora del evento menor o igual a la indicada (inclusive).</li>
     * </ul>
     *
     * <p>La validación de que {@code fechaDesde} no sea posterior a {@code fechaHasta} no se
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
                if (filter.getEventType() != null) {
                    predicates.add(cb.equal(root.get("eventType"), filter.getEventType()));
                }
                if (filter.getCuradorId() != null) {
                    predicates.add(cb.equal(root.get("leadCurator").get("id"), filter.getCuradorId()));
                }
                if (filter.getFechaDesde() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("datetime"), filter.getFechaDesde()));
                }
                if (filter.getFechaHasta() != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("datetime"), filter.getFechaHasta()));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
