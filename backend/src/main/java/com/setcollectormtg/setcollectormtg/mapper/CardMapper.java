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
    @Mapping(target = "userCollectionCards", ignore = true)
    @Mapping(target = "manaValueFromNode", ignore = true)
    @Mapping(target = "manaValue", expression = "java(cardCreateDto.getManaValue() != null ? cardCreateDto.getManaValue().doubleValue() : null)")
    @Mapping(target = "oracleText", source = "oracleText")
    Card toEntity(CardCreateDto cardCreateDto);

    @Mapping(target = "setId", source = "setMtg.setId")
    @Mapping(target = "oracleText", source = "oracleText")
    @Mapping(target = "cardType", source = "cardType")
    @Mapping(target = "manaValue", expression = "java(card.getManaValue() != null ? card.getManaValue().intValue() : null)")
    CardDto toDto(Card card);

    @Mapping(target = "setMtg", ignore = true)
    @Mapping(target = "cardId", ignore = true)
    @Mapping(target = "scryfallId", ignore = true)
    @Mapping(target = "userCollectionCards", ignore = true)
    @Mapping(target = "manaValueFromNode", ignore = true)
    @Mapping(target = "manaValue", expression = "java(cardDto.getManaValue() != null ? cardDto.getManaValue().doubleValue() : null)")
    @Mapping(target = "oracleText", source = "oracleText")
    @Mapping(target = "cardType", source = "cardType")
    @Mapping(target = "name", source = "name")
    @Mapping(target = "manaCost", source = "manaCost")
    @Mapping(target = "rarity", source = "rarity")
    @Mapping(target = "imageUrl", source = "imageUrl")
    void updateCardFromDto(CardDto cardDto, @MappingTarget Card card);
}