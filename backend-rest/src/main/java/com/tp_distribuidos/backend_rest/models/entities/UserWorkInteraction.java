package com.tp_distribuidos.backend_rest.models.entities;

import com.tp_distribuidos.backend_rest.enums.InteractionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_work_interactions", indexes = {
        @Index(name = "idx_uwi_user_id", columnList = "user_id"),
        @Index(name = "idx_uwi_work_id", columnList = "work_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserWorkInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "work_id", nullable = false)
    private Work work;

    @Enumerated(EnumType.STRING)
    @Column(name = "interaction_type", nullable = false, length = 50)
    private InteractionType interactionType;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public static UserWorkInteraction of(User user, Work work, InteractionType interactionType) {
        UserWorkInteraction interaction = new UserWorkInteraction();
        interaction.user = user;
        interaction.work = work;
        interaction.interactionType = interactionType;
        interaction.createdAt = LocalDateTime.now();
        return interaction;
    }
}
