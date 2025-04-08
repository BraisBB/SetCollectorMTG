package com.setcollectormtg.setcollectormtg.service; // O donde esté tu interfaz

import com.setcollectormtg.setcollectormtg.dto.UserCreateDto;
import com.setcollectormtg.setcollectormtg.dto.UserDto;
import com.setcollectormtg.setcollectormtg.model.User; // Necesario para el tipo de retorno
import org.springframework.security.oauth2.jwt.Jwt; // Necesario para el parámetro
import java.util.List;

public interface UserService {

    UserDto createUser(UserCreateDto userCreateDto); // Método existente

    List<UserDto> getAllUsers(); // Método existente

    UserDto getUserById(Long id); // Método existente

    UserDto updateUser(Long id, UserDto userDto); // Método existente

    void deleteUser(Long id); // Método existente

    /**
     * Sincroniza usuario basado en JWT de Keycloak.
     * Crea el usuario si no existe, actualiza datos si existen cambios.
     * @param jwt El token JWT del usuario autenticado.
     * @return La entidad User local sincronizada.
     */
    User synchronizeUser(Jwt jwt); // <-- NUEVO MÉTODO
}