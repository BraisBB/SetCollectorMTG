package com.setcollectormtg.setcollectormtg.mapper;

import com.setcollectormtg.setcollectormtg.dto.DeckCreateDto;
import com.setcollectormtg.setcollectormtg.dto.DeckDto;
import com.setcollectormtg.setcollectormtg.model.Deck;
import com.setcollectormtg.setcollectormtg.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface DeckMapper {

    @Mapping(source = "user.userId", target = "userId")
    DeckDto toDto(Deck deck);

    @Mapping(target = "deckId", ignore = true)
    @Mapping(target = "totalCards", ignore = true)
    @Mapping(source = "user", target = "user")
    Deck toEntity(DeckCreateDto dto, User user);
}