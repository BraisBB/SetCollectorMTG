package com.setcollectormtg.setcollectormtg.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
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

    @Column(nullable = false, unique = true)
    private String setCode;

    @Column(nullable = false)
    private String name;

    @Column(name = "total_cards")
    private Integer totalCards;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @OneToMany(mappedBy = "setMtg", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Card> cards = new ArrayList<>();

    // Método helper para la relación bidireccional
    public void addCard(Card card) {
        cards.add(card);
        card.setSetMtg(this);
    }
}