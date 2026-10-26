package com.tp_distribuidos.backend_rest.models.entities;

import com.tp_distribuidos.backend_rest.enums.WorkEra;
import com.tp_distribuidos.backend_rest.enums.WorkTechnique;
import com.tp_distribuidos.backend_rest.enums.WorkTopic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user_preferences")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserPreference {

    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "favorite_topics", columnDefinition = "json")
    private List<WorkTopic> favoriteTopics = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "favorite_techniques", columnDefinition = "json")
    private List<WorkTechnique> favoriteTechniques = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "favorite_eras", columnDefinition = "json")
    private List<WorkEra> favoriteEras = new ArrayList<>();

    public static UserPreference forUser(Long userId) {
        UserPreference preference = new UserPreference();
        preference.userId = userId;
        return preference;
    }

    public void update(List<WorkTopic> favoriteTopics,
                       List<WorkTechnique> favoriteTechniques,
                       List<WorkEra> favoriteEras) {
        this.favoriteTopics = favoriteTopics == null ? new ArrayList<>() : new ArrayList<>(favoriteTopics);
        this.favoriteTechniques = favoriteTechniques == null
                ? new ArrayList<>()
                : new ArrayList<>(favoriteTechniques);
        this.favoriteEras = favoriteEras == null ? new ArrayList<>() : new ArrayList<>(favoriteEras);
    }
}
