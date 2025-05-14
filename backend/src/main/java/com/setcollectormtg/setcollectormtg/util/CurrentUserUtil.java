package com.setcollectormtg.setcollectormtg.util;

import com.setcollectormtg.setcollectormtg.config.AuthenticationSynchronizationFilter;
import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Utilidad para obtener el usuario actual en cualquier parte de la aplicación.
 * Primero intenta obtener el usuario desde el atributo de la petición (establecido por el filtro).
 * Si no está disponible, lo sincroniza bajo demanda.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CurrentUserUtil {
    
    private final UserService userService;
    
    /**
     * Obtiene el usuario actual a partir del contexto de seguridad.
     * Primero intenta obtenerlo desde el atributo de la petición,
     * y si no está disponible, lo sincroniza bajo demanda.
     * 
     * @return El usuario actual o null si no hay usuario autenticado
     */
    public User getCurrentUser() {
        // Intentar obtener el usuario del atributo de la petición (establecido por el filtro)
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            User user = (User) request.getAttribute(AuthenticationSynchronizationFilter.USER_ATTRIBUTE);
            if (user != null) {
                return user;
            }
        }
        
        // Si no está disponible en la petición, obtenerlo del contexto de seguridad
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            log.debug("Obteniendo usuario actual para JWT con subject: {}", jwt.getSubject());
            return userService.synchronizeUser(jwt);
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