package com.setcollectormtg.setcollectormtg.dto;

import com.setcollectormtg.setcollectormtg.model.GameType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DeckDto {
    // ID será null cuando se esté creando un nuevo deck
    private Long deckId;

    @NotBlank(message = "El nombre del deck es obligatorio")
    @Size(min = 3, max = 50, message = "El nombre debe tener entre 3 y 50 caracteres")
    private String deckName;

    @NotNull(message = "El tipo de juego es obligatorio")
    private GameType gameType;

    @NotBlank(message = "El color del deck es obligatorio")
    private String deckColor;

    private Integer totalCards;

    @NotNull(message = "El ID de usuario es obligatorio")
    private Long userId; // Solo el ID del usuario
}
