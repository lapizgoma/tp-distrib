package com.tp_distribuidos.backend_rest.models.entities;

import com.tp_distribuidos.backend_rest.enums.WorkAvailability;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "works", indexes = {
        @Index(name = "idx_works_artist_id", columnList = "artist_id"),
        @Index(name = "idx_works_title", columnList = "title"),
        @Index(name = "idx_works_era", columnList = "era")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Work {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "artist_id", nullable = false)
    private Artist artist;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "creation_year")
    private Integer creationYear;

    @Column(length = 100)
    private String technique;

    @Column(length = 100)
    private String dimensions;

    @Column(length = 100)
    private String era;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 255)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WorkAvailability availability;

    @OneToMany(mappedBy = "work", fetch = FetchType.LAZY)
    private List<Comment> comments = new ArrayList<>();

    public static Work of(String title, Artist artist, String imageUrl, Integer creationYear,
                          String technique, String dimensions, String era, String description,
                          String location, WorkAvailability availability) {
        Work work = new Work();
        work.title = title;
        work.artist = artist;
        work.imageUrl = imageUrl;
        work.creationYear = creationYear;
        work.technique = technique;
        work.dimensions = dimensions;
        work.era = era;
        work.description = description;
        work.location = location;
        work.availability = availability;
        return work;
    }
}