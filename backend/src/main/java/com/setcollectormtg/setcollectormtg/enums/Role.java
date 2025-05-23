package com.setcollectormtg.setcollectormtg.enums;

import lombok.Getter;
import lombok.AllArgsConstructor;

/**
 * Enum que representa los diferentes roles de usuario en la aplicación.
 * Define los niveles de autorización y permisos para cada tipo de usuario.
 */
@Getter
@AllArgsConstructor
public enum Role {
    /**
     * Usuario estándar:
     * - Puede gestionar sus colecciones y mazos
     * - Acceso a funcionalidades básicas
     */
    USER("User", "Usuario estándar"),

    /**
     * Administrador:
     * - Acceso total al sistema
     * - Puede gestionar usuarios y importar cartas
     */
    ADMIN("Admin", "Administrador del sistema");

    private final String name;
    private final String description;

    /**
     * Convierte una cadena de texto en el rol correspondiente.
     *
     * @param role el nombre del rol
     * @return el enum Role correspondiente
     * @throws IllegalArgumentException si el rol no es válido
     */
    public static Role fromString(String role) {
        try {
            return Role.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + role);
        }
    }
} 