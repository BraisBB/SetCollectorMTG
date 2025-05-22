package com.setcollectormtg.setcollectormtg.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

/**
 * Conversor personalizado para extraer los roles de Keycloak desde un JWT y mapearlos a autoridades de Spring Security.
 *
 * Extrae tanto los roles de realm como los roles de cliente y los convierte en objetos SimpleGrantedAuthority
 * para ser utilizados por el sistema de autorización de Spring Security.
 */
@Component
public class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    // Lista de clientes a verificar para extraer roles
    private static final String[] CLIENT_IDS = {"setcollector-app", "setcollector-frontend", "setcollector-backend"};
    private static final Logger logger = LoggerFactory.getLogger(KeycloakRoleConverter.class);

    /**
     * Extrae los roles del JWT (realm y cliente) y los convierte en autoridades de Spring Security.
     *
     * @param jwt Token JWT recibido desde Keycloak
     * @return Colección de GrantedAuthority con los roles extraídos
     */
    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        
        String subject = jwt.getSubject();
        logger.info("Convirtiendo roles de JWT para usuario: {}", subject);
        
        // Agregar el logging para ver el token completo (solo en desarrollo)
        logger.debug("Token payload: {}", jwt.getClaims());

        // Roles del realm (los más importantes)
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            List<String> roles = (List<String>) realmAccess.get("roles");
            logger.info("Roles del realm encontrados: {}", roles);
            
            roles.forEach(roleName -> {
                // Convertir el rol a formato de autoridad (mayúsculas)
                String authorityRole = roleName.toUpperCase();
                logger.debug("Añadiendo rol de realm: {} -> autoridad: {}", roleName, authorityRole);
                authorities.add(new SimpleGrantedAuthority(authorityRole));
                
                // Log específico para roles importantes
                if (roleName.equalsIgnoreCase("admin") || roleName.equalsIgnoreCase("ADMIN")) {
                    logger.info("¡Rol de ADMIN encontrado para usuario: {}!", subject);
                    // Asegurar que se añade como ADMIN (en mayúsculas)
                    authorities.add(new SimpleGrantedAuthority("ADMIN"));
                }
                
                if (roleName.equalsIgnoreCase("user") || roleName.equalsIgnoreCase("USER")) {
                    logger.info("Rol de USER encontrado para usuario: {}", subject);
                    // Asegurar que se añade como USER (en mayúsculas)
                    authorities.add(new SimpleGrantedAuthority("USER"));
                }
            });
        } else {
            logger.warn("No se encontraron roles de realm en el token JWT para usuario: {}", subject);
        }

        // Roles de los clientes
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            // Verificar roles para cada cliente configurado
            for (String clientId : CLIENT_IDS) {
                Map<String, Object> clientAccess = (Map<String, Object>) resourceAccess.get(clientId);
                if (clientAccess != null && clientAccess.containsKey("roles")) {
                    List<String> roles = (List<String>) clientAccess.get("roles");
                    logger.info("Roles de cliente '{}' encontrados: {}", clientId, roles);
                    
                    roles.forEach(roleName -> {
                        String authorityRole = roleName.toUpperCase();
                        logger.debug("Añadiendo rol de cliente: {} -> autoridad: {}", roleName, authorityRole);
                        authorities.add(new SimpleGrantedAuthority(authorityRole));
                        
                        // Log específico para roles importantes
                        if (roleName.equalsIgnoreCase("admin")) {
                            logger.info("¡Rol de ADMIN encontrado en cliente '{}' para usuario: {}!", clientId, subject);
                        }
                    });
                } else {
                    logger.debug("No se encontraron roles para el cliente '{}' en el token JWT", clientId);
                }
            }
        } else {
            logger.debug("No se encontró información de 'resource_access' en el token JWT");
        }

        logger.info("Total de autoridades extraídas para usuario {}: {}", subject, authorities.size());
        logger.info("Autoridades resultantes: {}", authorities);
        
        // Si no hay autoridades pero existe un token válido, asignar al menos USER por defecto
        if (authorities.isEmpty()) {
            logger.info("No se encontraron roles explícitos. Asignando USER por defecto al usuario: {}", subject);
            authorities.add(new SimpleGrantedAuthority("USER"));
        }
        
        return authorities;
    }
}