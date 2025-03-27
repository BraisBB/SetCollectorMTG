package com.setcollectormtg.setcollectormtg.dto;

import lombok.Data;

@Data
public class DeckDto {
    private Long deckId;
    private String deckName;
    private String gameType;
    private String deckColor;
    private Integer totalCards; // Nuevo campo
    private Long userId; // Solo el ID del usuario

    // Constructor, getters y setters generados por @Data
}
