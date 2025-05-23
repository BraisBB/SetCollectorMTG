package com.setcollectormtg.setcollectormtg.mapper;

import com.setcollectormtg.setcollectormtg.dto.UserCreateDto;
import com.setcollectormtg.setcollectormtg.dto.UserDto;
import com.setcollectormtg.setcollectormtg.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {

    UserDto toDto(User user);

    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "joinDate", ignore = true)
    @Mapping(target = "decks", ignore = true)
    @Mapping(target = "userCollection", ignore = true)
    @Mapping(target = "enabled", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "authorities", ignore = true)
    User toEntity(UserCreateDto userCreateDto);

    @Mapping(target = "joinDate", ignore = true)
    @Mapping(target = "decks", ignore = true)
    @Mapping(target = "userCollection", ignore = true)
    @Mapping(target = "enabled", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "authorities", ignore = true)
    @Mapping(target = "password", ignore = true)
    void updateUserFromDto(UserDto userDto, @MappingTarget User user);
}