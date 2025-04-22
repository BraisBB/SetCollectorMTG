package com.setcollectormtg.setcollectormtg.dto;

import com.setcollectormtg.setcollectormtg.model.GameType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DeckDto {
    // ID will be null when creating a new deck
    private Long deckId;

    @NotBlank(message = "The deck name is mandatory")
    @Size(min = 3, max = 50, message = "The name must be between 3 and 50 characters")
    private String deckName;

    @NotNull(message = "The game type is mandatory")
    private GameType gameType;

    @NotBlank(message = "The deck color is mandatory")
    private String deckColor;

    private Integer totalCards;

    @NotNull(message = "The user ID is mandatory")
    private Long userId; // Only the user ID
}
