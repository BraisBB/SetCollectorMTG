package com.setcollectormtg.setcollectormtg.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @Column(name = "mana_value", nullable = false)
    private Integer manaValue;

    @Column(name = "mana_cost", nullable = false)
    private String manaCost;

    @Column(name = "card_type", nullable = false)
    private String cardType;

    @Column(name = "image_url")
    private String imageUrl;

    @ManyToOne
    @JoinColumn(name = "set_id", nullable = false)
    private Set set;
}
