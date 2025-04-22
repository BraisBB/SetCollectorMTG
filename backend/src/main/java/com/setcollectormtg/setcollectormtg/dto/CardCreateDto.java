package com.setcollectormtg.setcollectormtg.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;



@Data
@NoArgsConstructor
public class CardCreateDto {
    @NotBlank(message = "Card name is required")
    private String name;

    @NotBlank(message = "Rarity is required")
    private String rarity;

    private String oracleText;

    @NotNull(message = "Mana value is required")
    private Integer manaValue;

    @NotBlank(message = "Mana cost is required")
    private String manaCost;

    @NotBlank(message = "Card type is required")
    private String cardType;

    private String imageUrl;

    @NotNull(message = "Set ID is required")
    private Long setId;
}