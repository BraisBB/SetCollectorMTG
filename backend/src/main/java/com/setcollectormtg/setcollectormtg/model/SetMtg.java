package com.setcollectormtg.setcollectormtg.model;


import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "set_mtg")
public class SetMtg {
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

    @OneToMany(mappedBy = "setMtg", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Card> cards;
}
