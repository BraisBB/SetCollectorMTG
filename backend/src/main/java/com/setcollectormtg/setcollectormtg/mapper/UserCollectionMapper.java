package com.setcollectormtg.setcollectormtg.mapper;

import com.setcollectormtg.setcollectormtg.dto.UserCollectionDto;
import com.setcollectormtg.setcollectormtg.model.UserCollection;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserCollectionMapper {

    @Mapping(source = "user.userId", target = "userId")
    UserCollectionDto toDto(UserCollection userCollection);

    @Mapping(target = "collectionId", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "userCollectionCards", ignore = true)
    UserCollection toEntity(UserCollectionDto userCollectionDto);
}