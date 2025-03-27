package com.setcollectormtg.setcollectormtg.mapper;

import com.setcollectormtg.setcollectormtg.dto.CardCreateDto;
import com.setcollectormtg.setcollectormtg.dto.CardDto;
import com.setcollectormtg.setcollectormtg.model.Card;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface CardMapper {

    @Mapping(target = "setMtg", ignore = true)
    Card toEntity(CardCreateDto cardCreateDto);

    @Mapping(target = "setId", source = "setMtg.setId")
    CardDto toDto(Card card);

    @Mapping(target = "setMtg", ignore = true)
    void updateCardFromDto(CardDto cardDto, @MappingTarget Card card);
}