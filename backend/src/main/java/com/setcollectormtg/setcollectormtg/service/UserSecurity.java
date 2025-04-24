package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("userSecurity")
@RequiredArgsConstructor
@Slf4j
public class UserSecurity {

    private final UserRepository userRepository;

    /**
     * Verifica si el usuario autenticado es el propietario del recurso identificado por userId.
     * Devuelve true solo si el usuario autenticado corresponde al userId proporcionado.
     *
     * @param authentication Información de autenticación de Spring Security
     * @param userId         ID del usuario propietario del recurso
     * @return true si el usuario autenticado es el propietario, false en caso contrario
     */
    public boolean isOwner(Authentication authentication, Long userId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        return userRepository.findByKeycloakId(authentication.getName())
                .map(user -> user.getUserId().equals(userId))
                .orElse(false);
    }

    /**
     * Determina si el usuario autenticado puede acceder a un recurso de usuario.
     * Permite acceso si el usuario es ADMIN o es el propietario del recurso.
     *
     * @param authentication Información de autenticación de Spring Security
     * @param userId         ID del usuario propietario del recurso
     * @return true si el usuario es ADMIN o propietario, false en caso contrario
     */
    public boolean canAccessUserResource(Authentication authentication, Long userId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> "ADMIN".equals(auth.getAuthority()));

        log.debug("User {} isAdmin: {}", authentication.getName(), isAdmin);

        return isAdmin || isOwner(authentication, userId);
    }
}