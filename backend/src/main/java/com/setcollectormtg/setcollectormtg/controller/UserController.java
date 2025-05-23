package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.UserCreateDto;
import com.setcollectormtg.setcollectormtg.dto.UserDto;
import com.setcollectormtg.setcollectormtg.dto.UserRoleUpdateDto;
import com.setcollectormtg.setcollectormtg.service.UserService;
import com.setcollectormtg.setcollectormtg.util.CurrentUserUtil;
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
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;
    private final CurrentUserUtil currentUserUtil;

    /**
     * Creates a new user. This endpoint is public and requires no authentication.
     * Security is handled through data validation and duplicate user control.
     */
    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody UserCreateDto userCreateDto) {
        log.info("Creating user request received: {}", userCreateDto.getUsername());
        try {
            log.debug("User data to create: username={}, email={}, firstName={}, lastName={}",
                    userCreateDto.getUsername(), userCreateDto.getEmail(),
                    userCreateDto.getFirstName(), userCreateDto.getLastName());
                    
            UserDto createdUser = userService.createUser(userCreateDto);
            log.info("User created successfully: {}", createdUser.getUsername());
            return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error creating user {}: {}", userCreateDto.getUsername(), e.getMessage(), e);
            
            String errorMsg = e.getMessage();
            HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
            
            if (errorMsg != null) {
                if (errorMsg.contains("Username already exists") || 
                    errorMsg.contains("Email already in use")) {
                    status = HttpStatus.CONFLICT;
                } else if (errorMsg.contains("validation") || 
                           errorMsg.contains("invalid")) {
                    status = HttpStatus.BAD_REQUEST;
                }
            }
            
            return ResponseEntity
                .status(status)
                .body(new ErrorResponse("Error creating user", errorMsg));
        }
    }

    /**
     * Gets all users. Requires ADMIN authority.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        log.debug("Getting all users (requires ADMIN)");
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * Gets a user by ID. Accessible by ADMIN or the user themselves.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        log.debug("Getting user by ID: {}", id);
        return ResponseEntity.ok(userService.getUserById(id));
    }
    
    /**
     * Gets a user by username. Accessible by ADMIN or the user themselves.
     */
    @GetMapping("/username/{username}")
    @PreAuthorize("hasAuthority('ADMIN') or @userSecurity.canAccessUserByUsername(authentication, #username)")
    public ResponseEntity<UserDto> getUserByUsername(@PathVariable String username) {
        log.debug("Getting user by username: {}", username);
        return ResponseEntity.ok(userService.getUserByUsername(username));
    }

    /**
     * Updates a user. Accessible by ADMIN or the user themselves.
     */
    @PutMapping("/{id}")
    @PreAuthorize("@userSecurity.canAccessUserResource(authentication, #id)")
    public ResponseEntity<UserDto> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserDto userDto) {
        log.debug("Updating user with ID: {}", id);
        return ResponseEntity.ok(userService.updateUser(id, userDto));
    }
    
    /**
     * Updates a user by username. Accessible by ADMIN or the user themselves.
     */
    @PutMapping("/username/{username}")
    @PreAuthorize("hasAuthority('ADMIN') or @userSecurity.canAccessUserByUsername(authentication, #username)")
    public ResponseEntity<UserDto> updateUserByUsername(
            @PathVariable String username,
            @Valid @RequestBody UserDto userDto) {
        log.debug("Updating user with username: {}", username);
        return ResponseEntity.ok(userService.updateUserByUsername(username, userDto));
    }

    /**
     * Deletes a user. Requires ADMIN authority.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        log.debug("Deleting user with ID: {}", id);
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Assigns roles to a user. Requires ADMIN authority.
     */
    @PostMapping("/{id}/roles")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> assignRolesToUser(
            @PathVariable Long id,
            @Valid @RequestBody UserRoleUpdateDto roleUpdateDto) {
        log.debug("Assigning roles {} to user with ID: {}", roleUpdateDto.getRoles(), id);
        try {
            userService.assignRolesToUser(id, List.copyOf(roleUpdateDto.getRoles()));
            return ResponseEntity.ok().body(Map.of(
                "success", true,
                "message", "Roles assigned successfully",
                "userId", id,
                "assignedRoles", roleUpdateDto.getRoles()
            ));
        } catch (Exception e) {
            log.error("Error assigning roles to user {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error assigning roles: " + e.getMessage()
            ));
        }
    }

    /**
     * Removes a role from a user. Requires ADMIN authority.
     */
    @DeleteMapping("/{id}/roles/{roleName}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> removeRoleFromUser(
            @PathVariable Long id,
            @PathVariable String roleName) {
        log.debug("Removing role {} from user with ID: {}", roleName, id);
        userService.removeRoleFromUser(id, roleName);
        return ResponseEntity.ok().build();
    }

    /**
     * Gets user roles. Accessible by ADMIN or the user themselves.
     */
    @GetMapping("/{id}/roles")
    @PreAuthorize("hasAuthority('ADMIN') or @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<List<String>> getUserRoles(@PathVariable Long id) {
        log.debug("Getting roles for user with ID: {}", id);
        return ResponseEntity.ok(userService.getUserRoles(id));
    }

    /**
     * Gets paginated users list. Requires ADMIN authority.
     */
    @GetMapping("/paged")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Page<UserDto>> getAllUsersPaged(Pageable pageable) {
        log.debug("Getting paginated users (requires ADMIN)");
        return ResponseEntity.ok(userService.getAllUsersPaged(pageable));
    }

    /**
     * Gets the current authenticated user's profile.
     */
    @GetMapping("/me")
    @PreAuthorize("hasAnyAuthority('USER', 'ADMIN')")
    public ResponseEntity<UserDto> getCurrentUser() {
        log.debug("Getting current user profile");
        return ResponseEntity.ok(userService.getUserById(currentUserUtil.getCurrentUserId()));
    }
    
    /**
     * Error response DTO for consistent error handling
     */
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