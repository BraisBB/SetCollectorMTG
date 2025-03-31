package com.setcollectormtg.setcollectormtg.mapper;

import com.setcollectormtg.setcollectormtg.dto.DeckCreateDto;
import com.setcollectormtg.setcollectormtg.dto.DeckDto;
import com.setcollectormtg.setcollectormtg.model.Deck;
import com.setcollectormtg.setcollectormtg.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface DeckMapper {

    @Mapping(source = "user", target = "userId", qualifiedByName = "mapUserToUserId")
    DeckDto toDto(Deck deck);

    @Mapping(target = "deckId", ignore = true)
    @Mapping(target = "cardDecks", ignore = true) // Corregido: ahora usa el nombre correcto
    Deck toEntity(DeckCreateDto dto, User user);

    @Named("mapUserToUserId")
    default Long mapUserToUserId(User user) {
        return user != null ? user.getUserId() : null;
    }
}