package com.setcollectormtg.setcollectormtg.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SetMtgCreateDto {
    @NotBlank(message = "Set name is required")
    @Size(min = 3, max = 100, message = "Name must be between 3 and 100 characters")
    private String name;

    @NotBlank(message = "Set code is required")
    @Size(min = 3, max = 10, message = "Code must be between 3 and 10 characters")
    private String setCode;

    @NotNull(message = "Release date is required")
    private LocalDate releaseDate;

    @NotNull(message = "Total cards is required")
    @PositiveOrZero(message = "Total cards must be 0 or greater")
    private Integer totalCards = 0; // Default value
}