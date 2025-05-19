package com.setcollectormtg.setcollectormtg.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.PositiveOrZero;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CardCreateDto {
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

    private Long setId;
}