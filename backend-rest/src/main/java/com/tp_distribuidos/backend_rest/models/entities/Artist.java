package com.tp_distribuidos.backend_rest.models.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "artists")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Artist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String biography;

    @OneToMany(mappedBy = "artist", fetch = FetchType.LAZY)
    private List<Work> works = new ArrayList<>();

    public static Artist of(String name) {
        Artist artist = new Artist();
        artist.name = name;
        return artist;
    }

    public static Artist of(String name, String biography) {
        Artist artist = of(name);
        artist.biography = biography;
        return artist;
    }
}