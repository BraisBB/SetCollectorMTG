package com.setcollectormtg.setcollectormtg.util;

import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Utilidad para obtener el usuario actual en cualquier parte de la aplicación.
 * Obtiene el usuario del contexto de seguridad de Spring Security.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CurrentUserUtil {

    private final UserRepository userRepository;

    /**
     * Obtiene el usuario actual del contexto de seguridad.
     * 
     * @return El usuario actual o null si no hay ningún usuario autenticado
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() ||
                authentication.getName() == null || "anonymousUser".equals(authentication.getName())) {
            log.debug("No authenticated user found in security context");
            return null;
        }

        try {
            log.debug("Getting current user for username: {}", authentication.getName());
            return userRepository.findByUsername(authentication.getName()).orElse(null);
        } catch (Exception e) {
            log.error("Error getting current user: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Obtiene el ID del usuario actual.
     * 
     * @return El ID del usuario actual o null si no hay ningún usuario autenticado
     */
    public Long getCurrentUserId() {
        User currentUser = getCurrentUser();
        return currentUser != null ? currentUser.getUserId() : null;
    }

    /**
     * Obtiene el nombre de usuario actual del contexto de seguridad.
     * 
     * @return El nombre de usuario actual o null si no hay ningún usuario autenticado
     */
    public String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() ||
                "anonymousUser".equals(authentication.getName())) {
            return null;
        }

        return authentication.getName();
    }

    /**
     * Verifica si hay un usuario autenticado actualmente.
     * 
     * @return true si el usuario está autenticado, false en caso contrario
     */
    public boolean isUserAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated() &&
                authentication.getName() != null && !"anonymousUser".equals(authentication.getName());
    }
}