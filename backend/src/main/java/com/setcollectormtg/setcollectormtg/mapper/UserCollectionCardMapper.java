package com.setcollectormtg.setcollectormtg.mapper;

import com.setcollectormtg.setcollectormtg.dto.UserCollectionCardDto;
import com.setcollectormtg.setcollectormtg.model.UserCollectionCard;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserCollectionCardMapper {

    @Mapping(source = "id.collectionId", target = "collectionId")
    @Mapping(source = "id.cardId", target = "cardId")
    @Mapping(source = "card.name", target = "cardName")
    @Mapping(source = "card.imageUrl", target = "cardImageUrl")
    @Mapping(source = "card.cardType", target = "cardType")
    @Mapping(source = "card.manaCost", target = "manaCost")
    @Mapping(source = "card.rarity", target = "rarity")
    UserCollectionCardDto toDto(UserCollectionCard userCollectionCard);

    @Mapping(target = "id", expression = "java(new UserCollectionCardId(dto.getCollectionId(), dto.getCardId()))")
    @Mapping(target = "userCollection", ignore = true)
    @Mapping(target = "card", ignore = true)
    UserCollectionCard toEntity(UserCollectionCardDto dto);
}