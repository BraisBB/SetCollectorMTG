package com.setcollectormtg.setcollectormtg.dto;

import com.setcollectormtg.setcollectormtg.model.SetMtg;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

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