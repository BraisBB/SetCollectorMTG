package com.setcollectormtg.setcollectormtg.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.setcollectormtg.setcollectormtg.enums.GameType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DeckCreateDto {
    
    @NotBlank(message = "Deck name is required")
    @Size(min = 3, max = 50, message = "Name must be between 3 and 50 characters")
    private String deckName;

    @NotNull(message = "Game type is required")
    private GameType gameType;

    private String deckColor;
    
    /**
     * Permite establecer gameType tanto desde un enum como desde un String
     * para facilitar la deserialización desde JSON
     */
    @JsonSetter("gameType")
    public void setGameType(Object gameType) {
        if (gameType instanceof GameType) {
            this.gameType = (GameType) gameType;
        } else if (gameType instanceof String) {
            try {
                this.gameType = GameType.valueOf((String) gameType);
            } catch (IllegalArgumentException e) {
                // Si no es un valor válido, establecer STANDARD como valor por defecto
                this.gameType = GameType.STANDARD;
            }
        } else {
            // Valor por defecto
            this.gameType = GameType.STANDARD;
        }
    }
}