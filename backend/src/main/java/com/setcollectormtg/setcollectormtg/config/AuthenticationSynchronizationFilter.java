package com.setcollectormtg.setcollectormtg.config;

import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro que sincroniza automáticamente el usuario de Keycloak con nuestra base de datos
 * en cada petición autenticada.
 * 
 * Este filtro:
 * 1. Verifica si hay una autenticación válida con un token JWT
 * 2. Sincroniza el usuario de Keycloak con nuestra base de datos
 * 3. Almacena el usuario sincronizado en un atributo de la petición para su uso posterior
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuthenticationSynchronizationFilter extends OncePerRequestFilter {

    private final UserService userService;
    
    public static final String USER_ATTRIBUTE = "currentUser";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof Jwt) {
            try {
                Jwt jwt = (Jwt) authentication.getPrincipal();
                log.debug("Sincronizando usuario para token JWT con subject: {}", jwt.getSubject());
                
                // Sincronizar usuario con la base de datos
                User user = userService.synchronizeUser(jwt);
                
                // Almacenar el usuario sincronizado en la solicitud para su uso posterior
                request.setAttribute(USER_ATTRIBUTE, user);
                
                log.debug("Usuario sincronizado con ID: {}, Username: {}", user.getUserId(), user.getUsername());
            } catch (Exception e) {
                log.error("Error al sincronizar usuario durante la petición", e);
                // Continuamos con la cadena de filtros a pesar del error
            }
        }
        
        filterChain.doFilter(request, response);
    }
} 