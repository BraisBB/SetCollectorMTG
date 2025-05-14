package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.util.CurrentUserUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Servicio que proporciona métodos útiles para la autenticación y obtención del usuario actual.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final CurrentUserUtil currentUserUtil;
    
    /**
     * Obtiene el usuario actual autenticado.
     * 
     * @return El usuario actual o null si no hay usuario autenticado
     */
    public User getCurrentUser() {
        return currentUserUtil.getCurrentUser();
    }
    
    /**
     * Obtiene el ID del usuario actual autenticado.
     * 
     * @return El ID del usuario actual o null si no hay usuario autenticado
     */
    public Long getCurrentUserId() {
        return currentUserUtil.getCurrentUserId();
    }
    
    /**
     * Comprueba si el usuario actual es propietario de un recurso.
     * 
     * @param resourceId ID del recurso
     * @return true si el usuario actual es propietario del recurso, false en caso contrario
     */
    public boolean isResourceOwner(Long resourceId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return false;
        }
        
        // Si el recurso es el propio usuario
        if (currentUser.getUserId().equals(resourceId)) {
            return true;
        }
        
        // Para otros tipos de recursos, se delegará en UserSecurity
        return false;
    }
} 