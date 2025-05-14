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
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                log.debug("Autenticación nula o no autenticada");
                return false;
            }
            
            String keycloakId = authentication.getName();
            String userIdStr = userId.toString();
            log.debug("Verificando acceso: keycloakId={}, userId={}", keycloakId, userId);
            
            // Verificación 1: Coincidencia exacta con el ID de Keycloak completo
            if (keycloakId.equals(userIdStr)) {
                log.debug("El ID coincide exactamente con el ID de Keycloak");
                return true;
            }
            
            // Verificación 2: Verificar si el userIdStr es un prefijo del keycloakId
            // Esto maneja casos como '9833' que es un prefijo de '9833ae93-7ea6-4cdc-9bea-9f5a915b933c'
            if (keycloakId.startsWith(userIdStr)) {
                log.debug("El ID es un prefijo del ID de Keycloak: {} es prefijo de {}", userIdStr, keycloakId);
                return true;
            }
            
            // Verificación 3: Verificar el prefijo antes del primer guión
            // Por ejemplo, si keycloakId es '9833ae93-7ea6-4cdc-9bea-9f5a915b933c', tomar '9833ae93'
            int dashIndex = keycloakId.indexOf('-');
            if (dashIndex > 0) {
                String keycloakPrefix = keycloakId.substring(0, dashIndex);
                if (keycloakPrefix.equals(userIdStr)) {
                    log.debug("El ID coincide con el prefijo del ID de Keycloak hasta el primer guión");
                    return true;
                }
            }
            
            // Verificación 4: Solo primeros caracteres (para IDs numéricos cortos)
            // Si userId es solo un número pequeño, verificar si coincide con los primeros caracteres
            if (userIdStr.length() <= 5 && keycloakId.startsWith(userIdStr)) {
                log.debug("El ID numérico pequeño coincide con el inicio del ID de Keycloak");
                return true;
            }
            
            // Si no coincide de ninguna manera directa, buscamos en la base de datos
            log.debug("No hay coincidencia directa, buscando en la base de datos");
            return userRepository.findByKeycloakId(keycloakId)
                    .map(user -> {
                        boolean isOwner = user.getUserId().equals(userId);
                        log.debug("Verificación en BD: keycloakId={}, userId={}, resultado={}", 
                                keycloakId, userId, isOwner);
                        return isOwner;
                    })
                    .orElseGet(() -> {
                        log.warn("No se encontró usuario con keycloakId={} en la base de datos", keycloakId);
                        return false;
                    });
        } catch (Exception e) {
            log.error("Error inesperado en isOwner", e);
            // En caso de error, siempre rechazar por seguridad
            return false;
        }
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
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return false;
            }

            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(auth -> "ADMIN".equals(auth.getAuthority()));

            log.debug("User {} isAdmin: {}", authentication.getName(), isAdmin);

            return isAdmin || isOwner(authentication, userId);
        } catch (Exception e) {
            log.error("Error inesperado en canAccessUserResource", e);
            // En caso de error, siempre rechazar por seguridad
            return false;
        }
    }
}