package com.setcollectormtg.setcollectormtg.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Getter
@Setter
@ToString(exclude = {"cards"})
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
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SetMtg setMtg = (SetMtg) o;
        return Objects.equals(setId, setMtg.setId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(setId);
    }
}