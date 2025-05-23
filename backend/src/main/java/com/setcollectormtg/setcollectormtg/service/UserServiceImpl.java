package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.UserCreateDto;
import com.setcollectormtg.setcollectormtg.dto.UserDto;
import com.setcollectormtg.setcollectormtg.enums.Role;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.mapper.UserMapper;
import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserDto createUser(UserCreateDto userCreateDto) {
        log.info("Creando nuevo usuario: {}", userCreateDto.getUsername());

        // Verificar si el usuario ya existe
        if (userRepository.existsByUsername(userCreateDto.getUsername())) {
            throw new IllegalArgumentException("Username ya existe: " + userCreateDto.getUsername());
        }

        if (userRepository.existsByEmail(userCreateDto.getEmail())) {
            throw new IllegalArgumentException("Email ya existe: " + userCreateDto.getEmail());
        }

        // Crear entidad User
        User user = userMapper.toEntity(userCreateDto);
        user.setPassword(passwordEncoder.encode(userCreateDto.getPassword()));
        user.setEnabled(true);
        user.setRoles(Set.of(Role.USER)); // Por defecto rol USER

        User savedUser = userRepository.save(user);
        log.info("Usuario creado exitosamente con ID: {}", savedUser.getUserId());

        return userMapper.toDto(savedUser);
    }

    @Override
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));
        return userMapper.toDto(user);
    }

    @Override
    public UserDto getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));
        return userMapper.toDto(user);
    }

    @Override
    @Transactional
    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));

        userMapper.updateUserFromDto(userDto, user);
        User updatedUser = userRepository.save(user);
        
        return userMapper.toDto(updatedUser);
    }

    @Override
    @Transactional
    public UserDto updateUserByUsername(String username, UserDto userDto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));

        userMapper.updateUserFromDto(userDto, user);
        User updatedUser = userRepository.save(user);
        
        return userMapper.toDto(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("Usuario no encontrado con ID: " + id);
        }
        userRepository.deleteById(id);
        log.info("Usuario eliminado con ID: {}", id);
    }

    @Override
    @Transactional
    public void assignRolesToUser(Long id, List<String> roleNames) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));

        Set<Role> roles = roleNames.stream()
                .map(Role::valueOf)
                .collect(Collectors.toSet());

        user.setRoles(roles);
        userRepository.save(user);
        
        log.info("Roles asignados al usuario {}: {}", user.getUsername(), roleNames);
    }

    @Override
    @Transactional
    public void removeRoleFromUser(Long id, String roleName) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));

        user.getRoles().remove(Role.valueOf(roleName));
        userRepository.save(user);
        
        log.info("Rol {} removido del usuario {}", roleName, user.getUsername());
    }

    @Override
    public List<String> getUserRoles(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));

        return user.getRoles().stream()
                .map(Role::name)
                .collect(Collectors.toList());
    }

    @Override
    public Page<UserDto> getAllUsersPaged(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(userMapper::toDto);
    }
} 