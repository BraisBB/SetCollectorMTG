package com.setcollectormtg.setcollectormtg.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

/**
 * DTO for updating user roles from the admin panel.
 * Facilitates role management operations for administrators.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleUpdateDto {
    
    @NotEmpty(message = "At least one role must be specified")
    private Set<String> roles;
    
    /**
     * Constructor for single role operations
     */
    public UserRoleUpdateDto(String role) {
        this.roles = Set.of(role);
    }
} 