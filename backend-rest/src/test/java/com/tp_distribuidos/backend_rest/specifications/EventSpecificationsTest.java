package com.tp_distribuidos.backend_rest.specifications;

import com.tp_distribuidos.backend_rest.dtos.EventFilterRequestDTO;
import com.tp_distribuidos.backend_rest.enums.EventType;
import com.tp_distribuidos.backend_rest.models.entities.Event;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Root;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

@SuppressWarnings("unchecked")
@ExtendWith(MockitoExtension.class)
class EventSpecificationsTest {

    @Mock
    private Root<Event> root;

    @Mock
    private CriteriaQuery<?> query;

    @Mock
    private CriteriaBuilder cb;

    @Test
    void withFiltersAlwaysExcludesDeletedEvents() {
        Path<Object> deletedPath = mockDeletedPath();

        Specification<Event> specification = EventSpecifications.withFilters(null);
        specification.toPredicate(root, query, cb);

        assertDeletedPredicate(deletedPath);
    }

    @Test
    void withFiltersExcludesDeletedEventsEvenWhenFiltersArePresent() {
        Path<Object> deletedPath = mockDeletedPath();
        EventFilterRequestDTO filter = new EventFilterRequestDTO();
        filter.setType(EventType.VISITA_GUIADA);

        Specification<Event> specification = EventSpecifications.withFilters(filter);
        specification.toPredicate(root, query, cb);

        assertDeletedPredicate(deletedPath);
    }

    @Test
    void withReportFiltersAlwaysExcludesDeletedEvents() {
        Path<Object> deletedPath = mockDeletedPath();

        Specification<Event> specification = EventSpecifications.withReportFilters(null);
        specification.toPredicate(root, query, cb);

        assertDeletedPredicate(deletedPath);
    }

    private Path<Object> mockDeletedPath() {
        Path<Object> deletedPath = mock(Path.class);
        doReturn(deletedPath).when(root).get("deleted");
        return deletedPath;
    }

    private void assertDeletedPredicate(Path<Object> deletedPath) {
        ArgumentCaptor<Expression<Boolean>> captor = ArgumentCaptor.forClass(Expression.class);
        verify(cb).isFalse(captor.capture());
        assertThat(captor.getValue()).isSameAs(deletedPath);
    }
}
