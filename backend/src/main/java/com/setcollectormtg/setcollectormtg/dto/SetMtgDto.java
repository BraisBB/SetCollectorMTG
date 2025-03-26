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

    public static SetMtgDto fromEntity(SetMtg set) {
        SetMtgDto dto = new SetMtgDto();
        dto.setSetId(set.getSetId());
        dto.setName(set.getName());
        dto.setSetCode(set.getSetCode());
        dto.setTotalCards(set.getTotalCards());
        dto.setReleaseDate(set.getReleaseDate());

        if(set.getCards() != null) {
            dto.setCards(set.getCards().stream()
                    .map(CardDto::fromEntity)
                    .collect(Collectors.toList()));
        }

        return dto;
    }
}