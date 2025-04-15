package com.setcollectormtg.setcollectormtg.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class UserCollectionDto {
    @NotNull(message = "El ID de la colección es obligatorio")
    private Long collectionId;
    
    @NotNull(message = "El ID del usuario es obligatorio")
    private Long userId;
    
    @NotNull(message = "El total de cartas es obligatorio")
    @PositiveOrZero(message = "El total de cartas debe ser 0 o mayor")
    private Integer totalCards;
}