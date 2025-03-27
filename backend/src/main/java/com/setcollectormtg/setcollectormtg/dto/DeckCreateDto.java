package com.setcollectormtg.setcollectormtg.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DeckCreateDto {
    @NotBlank(message = "El nombre del deck es obligatorio")
    @Size(min = 3, max = 50, message = "El nombre debe tener entre 3 y 50 caracteres")
    private String deckName;

    @NotBlank(message = "El tipo de juego es obligatorio")
    private String gameType;

    @NotBlank(message = "El color del deck es obligatorio")
    private String deckColor;

    @PositiveOrZero(message = "El total de cartas debe ser 0 o mayor")
    private Integer totalCards = 0; // Valor por defecto

    @NotNull(message = "El ID de usuario es obligatorio")
    private Long userId; // Requerido para asociar el deck
}