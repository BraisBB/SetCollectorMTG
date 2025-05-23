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
 * Obtiene el usuario desde el contexto de seguridad de Spring Security.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CurrentUserUtil {
    
    private final UserRepository userRepository;
    
    /**
     * Obtiene el usuario actual a partir del contexto de seguridad.
     * 
     * @return El usuario actual o null si no hay usuario autenticado
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getName() != null) {
            log.debug("Obteniendo usuario actual para username: {}", authentication.getName());
            return userRepository.findByUsername(authentication.getName()).orElse(null);
        }
        
        return null;
    }
    
    /**
     * Obtiene el ID del usuario actual.
     * 
     * @return El ID del usuario actual o null si no hay usuario autenticado
     */
    public Long getCurrentUserId() {
        User currentUser = getCurrentUser();
        return currentUser != null ? currentUser.getUserId() : null;
    }
} 