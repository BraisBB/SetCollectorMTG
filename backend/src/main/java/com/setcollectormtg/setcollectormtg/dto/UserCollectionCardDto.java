package com.setcollectormtg.setcollectormtg.dto;

import lombok.Data;

@Data
public class UserCollectionCardDto {
    private Long collectionId;
    private Long cardId;
    private Integer nCopies;
    private String cardName;
    private String cardImageUrl;
    private String cardType;
    private String manaCost;
    private String rarity;
}