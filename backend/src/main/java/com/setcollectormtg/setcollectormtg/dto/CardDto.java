package com.setcollectormtg.setcollectormtg.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CardDto {
    private Long cardId;
    
    @NotBlank(message = "The card name is mandatory")
    private String name;
    
    @NotBlank(message = "The card rarity is mandatory")
    private String rarity;
    
    private String oracleText;
    
    @NotNull(message = "The mana value is mandatory")
    @PositiveOrZero(message = "The mana value must be 0 or greater")
    private Integer manaValue;
    
    @NotBlank(message = "The mana cost is mandatory")
    private String manaCost;
    
    @NotBlank(message = "The card type is mandatory")
    private String cardType;
    
    private String imageUrl;
    
    @NotNull(message = "The set ID is mandatory")
    private Long setId;
}