package com.setcollectormtg.setcollectormtg.service; // O donde esté tu interfaz

import com.setcollectormtg.setcollectormtg.dto.UserCreateDto;
import com.setcollectormtg.setcollectormtg.dto.UserDto;
import com.setcollectormtg.setcollectormtg.model.User; // Necesario para el tipo de retorno
import org.springframework.security.oauth2.jwt.Jwt; // Necesario para el parámetro
import java.util.List;

public interface UserService {
    UserDto createUser(UserCreateDto userCreateDto);
    User synchronizeUser(Jwt jwt);
    List<UserDto> getAllUsers();
    UserDto getUserById(Long id);
    UserDto updateUser(Long id, UserDto userDto);
    void deleteUser(Long id);

    // Nuevos métodos para gestión de roles
    void assignRolesToUser(Long id, List<String> roles);
    void removeRoleFromUser(Long id, String roleName);
    List<String> getUserRoles(Long id);
}