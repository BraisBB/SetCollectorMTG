package com.setcollectormtg.setcollectormtg.model;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @Column(name = "deck_name", nullable = false)
    private String deckName;

    @Column(name = "game_type", nullable = false)
    private String gameType;

    @Column(name = "deck_color", nullable = false)
    private String deckColor;

    @Column(name = "total_cards")
    private Integer totalCards;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
