package com.setcollectormtg.setcollectormtg.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "set")
public class Set {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "set_id")
    private Long setId;

    @Column(nullable = false)
    private String name;

    @Column(name = "total_cards", nullable = false)
    private Integer totalCards;

    @Column(name = "release_date", nullable = false)
    private LocalDate releaseDate;

    @OneToMany(mappedBy = "set", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Card> cards;
}
