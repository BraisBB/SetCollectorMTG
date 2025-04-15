package com.setcollectormtg.setcollectormtg.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CardDeckDto {
    @NotNull(message = "El ID del mazo es obligatorio")
    private Long deckId;
    
    @NotNull(message = "El ID de la carta es obligatorio")
    private Long cardId;
    
    @NotNull(message = "El número de copias es obligatorio")
    @Positive(message = "El número de copias debe ser mayor que 0")
    private Integer nCopies;
    
    private String cardName;
    private String cardImageUrl;
    private String cardType;
    private String manaCost;
}