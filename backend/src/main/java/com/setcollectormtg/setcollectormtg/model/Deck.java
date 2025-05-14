package com.setcollectormtg.setcollectormtg.model;

import com.setcollectormtg.setcollectormtg.enums.GameType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "deck")
public class Deck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "deck_id")
    private Long deckId;

    @Column(name = "deck_name", nullable = false, length = 50)
    private String deckName;

    @Enumerated(EnumType.STRING)
    @Column(name = "game_type", nullable = false)
    private GameType gameType;

    @Column(name = "deck_color", nullable = true, length = 30)
    private String deckColor;

    @Column(name = "total_cards", columnDefinition = "integer default 0")
    private Integer totalCards = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "deck", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<CardDeck> cardDecks = new HashSet<>();
}
