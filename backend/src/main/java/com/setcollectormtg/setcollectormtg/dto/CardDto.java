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
    
    @NotBlank(message = "El nombre de la carta es obligatorio")
    private String name;
    
    @NotBlank(message = "La rareza de la carta es obligatoria")
    private String rarity;
    
    private String oracleText;
    
    @NotNull(message = "El valor de maná es obligatorio")
    @PositiveOrZero(message = "El valor de maná debe ser 0 o mayor")
    private Integer manaValue;
    
    @NotBlank(message = "El coste de maná es obligatorio")
    private String manaCost;
    
    @NotBlank(message = "El tipo de carta es obligatorio")
    private String cardType;
    
    private String imageUrl;
    
    @NotNull(message = "El ID del set es obligatorio")
    private Long setId;
}