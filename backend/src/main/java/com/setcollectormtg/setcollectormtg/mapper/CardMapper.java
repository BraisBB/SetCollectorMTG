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
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.SET_TO_NULL
)
public interface CardMapper {

    @Mapping(target = "setMtg", ignore = true)
    @Mapping(target = "cardId", ignore = true)
    @Mapping(target = "scryfallId", ignore = true)
    @Mapping(target = "oracleText", ignore = true)
    @Mapping(target = "userCollectionCards", ignore = true)
    @Mapping(target = "manaValueFromNode", ignore = true)
    @Mapping(target = "manaValue", source = "manaValue")
    Card toEntity(CardCreateDto cardCreateDto);

    @Mapping(target = "setId", source = "setMtg.setId")
    @Mapping(target = "oracleText", source = "oracleText")
    @Mapping(target = "cardType", source = "cardType")
    CardDto toDto(Card card);

    @Mapping(target = "setMtg", ignore = true)
    @Mapping(target = "scryfallId", ignore = true)
    @Mapping(target = "oracleText", ignore = true)
    @Mapping(target = "userCollectionCards", ignore = true)
    @Mapping(target = "manaValueFromNode", ignore = true)
    @Mapping(target = "manaValue", source = "manaValue")
    void updateCardFromDto(CardDto cardDto, @MappingTarget Card card);
}