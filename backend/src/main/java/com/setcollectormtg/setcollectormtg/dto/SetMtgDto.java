package com.setcollectormtg.setcollectormtg.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;


@Data
@NoArgsConstructor
public class SetMtgDto {
    private Long setId;
    private String name;
    private String setCode;
    private Integer totalCards;
    private LocalDate releaseDate;
    private List<CardDto> cards;


}