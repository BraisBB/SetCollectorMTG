package com.setcollectormtg.setcollectormtg.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserCreateDto {
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 20, message = "Username must be between 3 and 20 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    // --- CONTRASEÑA ELIMINADA ---
    // @NotBlank(message = "Password is required")
    // @Size(min = 6, message = "Password must be at least 6 characters")
    // private String password;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    // --- KEYCLOAK ID AÑADIDO (si mantienes createUser) ---
    @NotBlank(message = "Keycloak ID is required for manual creation")
    private String keycloakId; // Necesario ya que es not-null/unique en la entidad User
}