package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.UserCreateDto;
import com.setcollectormtg.setcollectormtg.dto.UserDto;
import com.setcollectormtg.setcollectormtg.model.User;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {
    UserDto createUser(UserCreateDto userCreateDto);



    List<UserDto> getAllUsers();

    UserDto getUserById(Long id);
    
    UserDto getUserByUsername(String username);

    UserDto updateUser(Long id, UserDto userDto);
    
    UserDto updateUserByUsername(String username, UserDto userDto);

    void deleteUser(Long id);

    void assignRolesToUser(Long id, List<String> roles);

    void removeRoleFromUser(Long id, String roleName);

    List<String> getUserRoles(Long id);

    Page<UserDto> getAllUsersPaged(Pageable pageable);
}