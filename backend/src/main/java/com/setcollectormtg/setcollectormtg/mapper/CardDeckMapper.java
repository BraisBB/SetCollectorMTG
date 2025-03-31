package com.setcollectormtg.setcollectormtg.mapper;

import com.setcollectormtg.setcollectormtg.dto.CardDeckDto;
import com.setcollectormtg.setcollectormtg.model.CardDeck;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface CardDeckMapper {

    @Mapping(source = "id.deckId", target = "deckId")
    @Mapping(source = "id.cardId", target = "cardId")
    @Mapping(source = "card.name", target = "cardName")
    @Mapping(source = "card.imageUrl", target = "cardImageUrl")
    @Mapping(source = "card.cardType", target = "cardType")
    @Mapping(source = "card.manaCost", target = "manaCost")
    CardDeckDto toDto(CardDeck cardDeck);

    @Mapping(target = "id", expression = "java(new CardDeckId(dto.getDeckId(), dto.getCardId()))")
    @Mapping(target = "deck", ignore = true)
    @Mapping(target = "card", ignore = true)
    CardDeck toEntity(CardDeckDto dto);
}