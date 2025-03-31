package com.setcollectormtg.setcollectormtg.dto;

import lombok.Data;

@Data
public class CardDeckDto {
    private Long deckId;
    private Long cardId;
    private Integer nCopies;
    private String cardName;
    private String cardImageUrl;
    private String cardType;
    private String manaCost;
}