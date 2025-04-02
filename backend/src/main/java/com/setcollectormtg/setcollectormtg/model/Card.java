package com.setcollectormtg.setcollectormtg.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "card")
public class Card {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "card_id")
    private Long cardId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String rarity;

    @Column(name = "oracle_text", columnDefinition = "TEXT")
    private String oracleText;

    @Column(name = "mana_value")
    private Double manaValue; // Cambiado a Double para manejar costes como {X}

    @Column(name = "mana_cost")
    private String manaCost;

    @Column(name = "card_type", nullable = false)
    private String cardType;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "scryfall_id")
    private String scryfallId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "set_id", nullable = false)
    private SetMtg setMtg;

    @OneToMany(mappedBy = "card", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<UserCollectionCard> userCollectionCards = new ArrayList<>();

    // Método helper para convertir tipos
    public void setManaValueFromNode(JsonNode node) {
        if (node != null && !node.isNull()) {
            this.manaValue = node.asDouble();
        }
    }
}