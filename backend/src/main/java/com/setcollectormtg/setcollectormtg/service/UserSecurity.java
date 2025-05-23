package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.model.Deck;
import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.repository.DeckRepository;
import com.setcollectormtg.setcollectormtg.repository.UserCollectionRepository;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Component("userSecurity")
@RequiredArgsConstructor
@Slf4j
public class UserSecurity {

    private final UserRepository userRepository;
    private final DeckRepository deckRepository;
    private final UserCollectionRepository collectionRepository;

    private static final List<String> ADMIN_AUTHORITIES = List.of("ADMIN");

    /**
     * Verifica si el usuario autenticado es el propietario del recurso identificado
     * por resourceId.
     * Detecta automáticamente el tipo de recurso (usuario, mazo o colección) y
     * verifica la propiedad.
     *
     * @param authentication Información de autenticación de Spring Security
     * @param resourceId     ID del recurso a verificar
     * @return true si el usuario autenticado es el propietario, false en caso
     *         contrario
     */
    public boolean isOwner(Authentication authentication, Long resourceId) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                log.debug("Autenticación nula o no autenticada");
                return false;
            }

            // Si el usuario es admin, siempre permitir
            if (isAdmin(authentication)) {
                log.debug("Usuario con rol de admin, permitiendo acceso: {}", authentication.getName());
                return true;
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
                            .orElse(false));
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
                log.warn("Authentication null or not authenticated");
                return false;
            }

            log.debug("Verificando acceso: usuario={}, roles={}",
                    authentication.getName(),
                    authentication.getAuthorities());

            // Verificar rol de administrador
            boolean isAdmin = isAdmin(authentication);
            log.info("Usuario {} isAdmin: {}", authentication.getName(), isAdmin);

            // Si es admin, permitir acceso
            if (isAdmin) {
                log.info("Acceso concedido a usuario {} por rol ADMIN", authentication.getName());
                return true;
            }

            // Si no es admin, verificar propiedad
            boolean isOwner = isOwner(authentication, resourceId);
            log.info("Usuario {} es propietario del recurso {}: {}",
                    authentication.getName(), resourceId, isOwner);

            return isOwner;
        } catch (Exception e) {
            log.error("Error inesperado en canAccessUserResource", e);
            // En caso de error, siempre rechazar por seguridad
            return false;
        }
    }

    /**
     * Verifica si el usuario actual es administrador.
     * Busca cualquiera de los roles de administrador conocidos.
     */
    public boolean isAdmin(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        if (log.isDebugEnabled()) {
            String authoritiesList = authorities.stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.joining(", "));
            log.debug("Verificando si el usuario {} es admin. Authorities: {}",
                    authentication.getName(), authoritiesList);
        }

        boolean isAdmin = authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(ADMIN_AUTHORITIES::contains);

        log.debug("¿El usuario {} es admin? {}", authentication.getName(), isAdmin);
        return isAdmin;
    }

    /**
     * Verifica si el contexto de seguridad actual tiene el rol de administrador.
     * Método de conveniencia para uso en código cuando no hay autenticación
     * disponible.
     */
    public boolean isCurrentUserAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return isAdmin(auth);
    }

    /**
     * Verifica si el usuario autenticado puede acceder a un recurso de usuario por
     * username.
     * Permite acceso si el usuario es ADMIN o es el mismo usuario.
     *
     * @param authentication Información de autenticación de Spring Security
     * @param username       Username del usuario al que se quiere acceder
     * @return true si el usuario es ADMIN o es el mismo usuario, false en caso
     *         contrario
     */
    public boolean canAccessUserByUsername(Authentication authentication, String username) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                log.warn("Authentication null or not authenticated");
                return false;
            }

            log.debug("Verificando acceso por username: usuario={}, target={}",
                    authentication.getName(), username);

            // Verificar rol de administrador
            if (isAdmin(authentication)) {
                log.info("Acceso concedido a usuario {} por rol ADMIN", authentication.getName());
                return true;
            }

            // Obtener el usuario actual y verificar si es el mismo username
            User currentUser = getCurrentUserFromRequest();
            if (currentUser == null) {
                log.warn("No se pudo obtener el usuario actual");
                return false;
            }

            boolean isSameUser = currentUser.getUsername().equals(username);
            log.info("Usuario {} intentando acceder a usuario {}: es el mismo: {}",
                    currentUser.getUsername(), username, isSameUser);

            return isSameUser;
        } catch (Exception e) {
            log.error("Error inesperado en canAccessUserByUsername", e);
            return false;
        }
    }

    /** * Obtiene el usuario actual desde el contexto de seguridad de Spring. */
    private User getCurrentUserFromRequest() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getName() != null) {
            return userRepository.findByUsername(auth.getName()).orElse(null);
        }
        return null;
    }
}