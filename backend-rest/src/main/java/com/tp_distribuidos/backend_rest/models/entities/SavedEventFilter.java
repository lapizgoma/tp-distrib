package com.tp_distribuidos.backend_rest.models.entities;

import com.tp_distribuidos.backend_rest.dtos.EventFilterConfigDTO;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "saved_event_filters")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SavedEventFilter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "filter_config", columnDefinition = "json")
    private EventFilterConfigDTO filterConfig;

    public static SavedEventFilter of(User user, String name) {
        SavedEventFilter filter = new SavedEventFilter();
        filter.user = user;
        filter.name = name;
        return filter;
    }

    public static SavedEventFilter of(User user, String name, String description, EventFilterConfigDTO filterConfig) {
        SavedEventFilter filter = of(user, name);
        filter.description = description;
        filter.filterConfig = filterConfig;
        return filter;
    }
}