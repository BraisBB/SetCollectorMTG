package com.setcollectormtg.setcollectormtg.model;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "card_deck",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = { "deck_id", "card_id" }
                )
        }
)
public class CardDeck {

    @EmbeddedId
    private CardDeckId id; // Clave compuesta

    @ManyToOne
    @MapsId("deckId") // Mapea la parte de deckId en la clave compuesta
    @JoinColumn(name = "deck_id", nullable = false)
    private Deck deck;

    @ManyToOne
    @MapsId("cardId") // Mapea la parte de cardId en la clave compuesta
    @JoinColumn(name = "card_id", nullable = false)
    private Card card;

    @Column(name = "n_copies", nullable = false)
    private Integer nCopies;
}
