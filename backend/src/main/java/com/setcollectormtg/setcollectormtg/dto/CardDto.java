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
}