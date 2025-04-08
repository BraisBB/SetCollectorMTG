package com.setcollectormtg.setcollectormtg.mapper;

import com.setcollectormtg.setcollectormtg.dto.UserCreateDto;
import com.setcollectormtg.setcollectormtg.dto.UserDto;
import com.setcollectormtg.setcollectormtg.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface UserMapper {
    // Convierte Entidad -> DTO (para enviar al cliente)
    UserDto toDto(User user);

    // Convierte DTO (de creación manual) -> Entidad
    @Mapping(target = "userId", ignore = true) // ID es generado por la BD
    @Mapping(target = "joinDate", ignore = true) // joinDate es generado (@CreationTimestamp)
    @Mapping(target = "decks", ignore = true) // decks se manejan por separado
    @Mapping(target = "userCollection", ignore = true) // userCollection se crea/asocia en el servicio
    // MapStruct mapeará automáticamente 'keycloakId' si los nombres coinciden
    User toEntity(UserCreateDto userCreateDto);

    // Actualiza Entidad existente desde DTO (ej. perfil de usuario)
    // 'userId' del DTO se ignora por defecto al actualizar @MappingTarget
    @Mapping(target = "joinDate", ignore = true) // No actualizamos fecha de registro
    @Mapping(target = "decks", ignore = true) // No actualizamos decks desde este DTO
    @Mapping(target = "userCollection", ignore = true) // No actualizamos colección desde este DTO
    @Mapping(target = "keycloakId", ignore = true) // NUNCA actualizamos keycloakId desde un DTO de perfil
    // @Mapping(target = "password", ignore = true) // --> REDUNDANTE, eliminado
    void updateUserFromDto(UserDto userDto, @MappingTarget User user);
}