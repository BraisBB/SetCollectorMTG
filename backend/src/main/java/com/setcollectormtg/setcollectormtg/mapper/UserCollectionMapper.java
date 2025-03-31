package com.setcollectormtg.setcollectormtg.mapper;

import com.setcollectormtg.setcollectormtg.dto.UserCollectionDto;
import com.setcollectormtg.setcollectormtg.model.UserCollection;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserCollectionMapper {

    @Mapping(source = "user.userId", target = "userId")
    UserCollectionDto toDto(UserCollection userCollection);

    @Mapping(target = "collectionId", ignore = true)
    UserCollection toEntity(UserCollectionDto userCollectionDto);
}