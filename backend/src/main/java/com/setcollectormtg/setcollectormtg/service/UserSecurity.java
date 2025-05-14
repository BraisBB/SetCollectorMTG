package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.config.AuthenticationSynchronizationFilter;
import com.setcollectormtg.setcollectormtg.model.Deck;
import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.repository.DeckRepository;
import com.setcollectormtg.setcollectormtg.repository.UserCollectionRepository;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component("userSecurity")
@RequiredArgsConstructor
@Slf4j
public class UserSecurity {

    private final UserRepository userRepository;
    private final DeckRepository deckRepository;
    private final UserCollectionRepository collectionRepository;

    /**
     * Verifica si el usuario autenticado es el propietario del recurso identificado por resourceId.
     * Detecta automáticamente el tipo de recurso (usuario, mazo o colección) y verifica la propiedad.
     *
     * @param authentication Información de autenticación de Spring Security
     * @param resourceId     ID del recurso a verificar
     * @return true si el usuario autenticado es el propietario, false en caso contrario
     */
    public boolean isOwner(Authentication authentication, Long resourceId) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                log.debug("Autenticación nula o no autenticada");
                return false;
            }

            // Obtener el usuario sincronizado desde el atributo de la petición
            User currentUser = getCurrentUserFromRequest();
            if (currentUser == null) {
                log.warn("No se pudo obtener el usuario actual de la petición");
                return false;
            }
            
            log.debug("Verificando propiedad: usuario={}, resourceId={}", 
                     currentUser.getUserId(), resourceId);

            // 1. Verificar si es el ID del propio usuario
            if (currentUser.getUserId().equals(resourceId)) {
                log.debug("El recurso es el propio usuario");
                return true;
            }

            // 2. Verificar si es un ID de mazo
            return deckRepository.findById(resourceId)
                    .map(deck -> {
                        boolean isOwner = deck.getUser().getUserId().equals(currentUser.getUserId());
                        log.debug("El recurso es un mazo. Propiedad: {}", isOwner);
                        return isOwner;
                    })
                    .orElseGet(() -> 
                        // 3. Verificar si es un ID de colección
                        collectionRepository.findById(resourceId)
                            .map(collection -> {
                                boolean isOwner = collection.getUser().getUserId().equals(currentUser.getUserId());
                                log.debug("El recurso es una colección. Propiedad: {}", isOwner);
                                return isOwner;
                            })
                            .orElse(false)
                    );
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
     * @param resourceId     ID del recurso
     * @return true si el usuario es ADMIN o propietario, false en caso contrario
     */
    public boolean canAccessUserResource(Authentication authentication, Long resourceId) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return false;
            }

            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(auth -> "ADMIN".equals(auth.getAuthority()));

            log.debug("User {} isAdmin: {}", authentication.getName(), isAdmin);

            return isAdmin || isOwner(authentication, resourceId);
        } catch (Exception e) {
            log.error("Error inesperado en canAccessUserResource", e);
            // En caso de error, siempre rechazar por seguridad
            return false;
        }
    }
    
    /**
     * Obtiene el usuario actual desde el atributo de la petición establecido por el filtro.
     */
    private User getCurrentUserFromRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            return (User) request.getAttribute(AuthenticationSynchronizationFilter.USER_ATTRIBUTE);
        }
        return null;
    }
}