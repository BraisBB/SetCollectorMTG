package com.setcollectormtg.setcollectormtg.model;

import jakarta.persistence.*;
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

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
