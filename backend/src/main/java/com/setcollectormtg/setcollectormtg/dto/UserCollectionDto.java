package com.setcollectormtg.setcollectormtg.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;


@Data
public class UserCollectionDto {
    @NotNull(message = "Set ID is required")
    private Long collectionId;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Total cards are required")
    @PositiveOrZero(message = "Total cards must be 0 or greater")
    private Integer totalCards;
}