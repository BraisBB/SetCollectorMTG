package com.setcollectormtg.setcollectormtg.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CardDeckDto {
    @NotNull(message = "Deck ID is required")
    private Long deckId;
    
    @NotNull(message = "Card ID is required")
    private Long cardId;
    
    @NotNull(message = "Number of copies is required")
    @Positive(message = "Number of copies must be greater than 0")
    private Integer nCopies;
    
    private String cardName;
    private String cardImageUrl;
    private String cardType;
    private String manaCost;
}