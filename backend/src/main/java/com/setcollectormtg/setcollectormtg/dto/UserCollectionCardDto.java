package com.setcollectormtg.setcollectormtg.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class UserCollectionCardDto {
    @NotNull(message = "El ID de la colección es obligatorio")
    private Long collectionId;
    
    @NotNull(message = "El ID de la carta es obligatorio")
    private Long cardId;
    
    @NotNull(message = "El número de copias es obligatorio")
    @Positive(message = "El número de copias debe ser mayor que 0")
    private Integer nCopies;
    
    private String cardName;
    private String cardImageUrl;
    private String cardType;
    private String manaCost;
    private String rarity;
}