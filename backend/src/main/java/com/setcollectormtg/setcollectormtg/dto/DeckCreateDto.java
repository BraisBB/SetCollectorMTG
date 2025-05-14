package com.setcollectormtg.setcollectormtg.dto;

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
}