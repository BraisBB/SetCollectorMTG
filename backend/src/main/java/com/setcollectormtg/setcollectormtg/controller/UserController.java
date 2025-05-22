package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.UserCreateDto;
import com.setcollectormtg.setcollectormtg.dto.UserDto;
import com.setcollectormtg.setcollectormtg.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody UserCreateDto userCreateDto) {
        log.info("Recibida solicitud para crear usuario: {}", userCreateDto.getUsername());
        try {
            log.debug("Datos de usuario a crear: username={}, email={}, firstName={}, lastName={}",
                    userCreateDto.getUsername(), userCreateDto.getEmail(),
                    userCreateDto.getFirstName(), userCreateDto.getLastName());
                    
            // Este endpoint es público y debe funcionar sin autenticación
            // La seguridad está en la validación de datos y en el control de usuarios duplicados
            UserDto createdUser = userService.createUser(userCreateDto);
            log.info("Usuario creado exitosamente: {}", createdUser.getUsername());
            return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error al crear usuario {}: {}", userCreateDto.getUsername(), e.getMessage(), e);
            
            // Devolver un mensaje de error más descriptivo
            String errorMsg = e.getMessage();
            HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
            
            // Asignar códigos de estado HTTP más específicos según el tipo de error
            if (errorMsg != null) {
                if (errorMsg.contains("Username already exists") || 
                    errorMsg.contains("Email already in use")) {
                    status = HttpStatus.CONFLICT; // 409 - Conflict
                } else if (errorMsg.contains("validation") || 
                           errorMsg.contains("invalid")) {
                    status = HttpStatus.BAD_REQUEST; // 400 - Bad Request
                }
            }
            
            return ResponseEntity
                .status(status)
                .body(new ErrorResponse("Error al crear usuario", errorMsg));
        }
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        log.debug("Obteniendo todos los usuarios (requiere ADMIN)");
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        log.debug("Obteniendo usuario por ID: {}", id);
        return ResponseEntity.ok(userService.getUserById(id));
    }
    
    @GetMapping("/username/{username}")
    public ResponseEntity<UserDto> getUserByUsername(@PathVariable String username) {
        log.debug("Obteniendo usuario por username: {}", username);
        return ResponseEntity.ok(userService.getUserByUsername(username));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@userSecurity.canAccessUserResource(authentication, #id)")
    public ResponseEntity<UserDto> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserDto userDto) {
        log.debug("Actualizando usuario con ID: {}", id);
        return ResponseEntity.ok(userService.updateUser(id, userDto));
    }
    
    @PutMapping("/username/{username}")
    public ResponseEntity<UserDto> updateUserByUsername(
            @PathVariable String username,
            @Valid @RequestBody UserDto userDto) {
        log.debug("Actualizando usuario con username: {}", username);
        return ResponseEntity.ok(userService.updateUserByUsername(username, userDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        log.debug("Eliminando usuario con ID: {}", id);
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/roles")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> assignRolesToUser(
            @PathVariable Long id,
            @RequestBody List<String> roles) {
        log.debug("Asignando roles {} al usuario con ID: {}", roles, id);
        userService.assignRolesToUser(id, roles);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/roles/{roleName}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> removeRoleFromUser(
            @PathVariable Long id,
            @PathVariable String roleName) {
        log.debug("Eliminando rol {} del usuario con ID: {}", roleName, id);
        userService.removeRoleFromUser(id, roleName);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/roles")
    @PreAuthorize("hasAuthority('ADMIN') or @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<List<String>> getUserRoles(@PathVariable Long id) {
        log.debug("Obteniendo roles del usuario con ID: {}", id);
        return ResponseEntity.ok(userService.getUserRoles(id));
    }

    @GetMapping("/paged")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Page<UserDto>> getAllUsersPaged(Pageable pageable) {
        log.debug("Obteniendo usuarios paginados (requiere ADMIN)");
        return ResponseEntity.ok(userService.getAllUsersPaged(pageable));
    }
    
    private static class ErrorResponse {
        private final String message;
        private final String details;
        
        public ErrorResponse(String message, String details) {
            this.message = message;
            this.details = details;
        }
        
        public String getMessage() {
            return message;
        }
        
        public String getDetails() {
            return details;
        }
    }
}