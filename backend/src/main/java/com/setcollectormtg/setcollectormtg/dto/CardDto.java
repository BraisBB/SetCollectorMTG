package com.setcollectormtg.setcollectormtg.dto;

import com.setcollectormtg.setcollectormtg.model.Card;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CardDto {
    private Long cardId;
    private String name;
    private String rarity;
    private String oracleText;
    private Integer manaValue;
    private String manaCost;
    private String cardType;
    private String imageUrl;
    private Long setId; // Solo el ID del set, no el objeto completo

    public static CardDto fromEntity(Card card) {
        CardDto dto = new CardDto();
        dto.setCardId(card.getCardId());
        dto.setName(card.getName());
        dto.setRarity(card.getRarity());
        dto.setOracleText(card.getOracleText());
        dto.setManaValue(card.getManaValue());
        dto.setManaCost(card.getManaCost());
        dto.setCardType(card.getCardType());
        dto.setImageUrl(card.getImageUrl());
        if(card.getSetMtg() != null) {
            dto.setSetId(card.getSetMtg().getSetId());
        }
        return dto;
    }

    public Card toEntity() {
        Card card = new Card();
        card.setCardId(this.getCardId());
        card.setName(this.getName());
        card.setRarity(this.getRarity());
        card.setOracleText(this.getOracleText());
        card.setManaValue(this.getManaValue());
        card.setManaCost(this.getManaCost());
        card.setCardType(this.getCardType());
        card.setImageUrl(this.getImageUrl());
        // Nota: setMtg debe ser manejado aparte con el setId
        return card;
    }
}