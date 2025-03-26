package com.setcollectormtg.setcollectormtg.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;



@Data
@NoArgsConstructor
public class CardCreateDto {
    @NotBlank
    private String name;

    @NotBlank
    private String rarity;

    private String oracleText;

    @NotNull
    private Integer manaValue;

    @NotBlank
    private String manaCost;

    @NotBlank
    private String cardType;

    private String imageUrl;

    @NotNull
    private Long setId;
}