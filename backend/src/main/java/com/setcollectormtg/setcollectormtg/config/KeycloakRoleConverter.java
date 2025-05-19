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
 * Extrae tanto los roles de realm como los roles de cliente (setcollector-app) y los convierte en objetos SimpleGrantedAuthority
 * en mayúsculas, para ser utilizados por el sistema de autorización de Spring Security.
 */
@Component
public class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    private static final String CLIENT_ID = "setcollector-app";
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

        logger.debug("Convirtiendo roles de JWT para usuario: {}", jwt.getSubject());

        // Roles del realm
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            List<String> roles = (List<String>) realmAccess.get("roles");
            logger.debug("Roles del realm encontrados: {}", roles);
            
            roles.forEach(roleName -> {
                String authorityRole = roleName.toUpperCase();
                logger.debug("Añadiendo rol de realm: {} -> autoridad: {}", roleName, authorityRole);
                authorities.add(new SimpleGrantedAuthority(authorityRole));
                
                // Log específico para el rol de administrador
                if (roleName.equalsIgnoreCase("admin")) {
                    logger.info("¡Rol de ADMIN encontrado para usuario: {}!", jwt.getSubject());
                }
            });
        } else {
            logger.debug("No se encontraron roles de realm en el token JWT");
        }

        // Roles del cliente específico
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            Map<String, Object> clientAccess = (Map<String, Object>) resourceAccess.get(CLIENT_ID);
            if (clientAccess != null && clientAccess.containsKey("roles")) {
                List<String> roles = (List<String>) clientAccess.get("roles");
                logger.debug("Roles de cliente '{}' encontrados: {}", CLIENT_ID, roles);
                
                roles.forEach(roleName -> {
                    String authorityRole = roleName.toUpperCase();
                    logger.debug("Añadiendo rol de cliente: {} -> autoridad: {}", roleName, authorityRole);
                    authorities.add(new SimpleGrantedAuthority(authorityRole));
                    
                    // Log específico para el rol de administrador
                    if (roleName.equalsIgnoreCase("admin")) {
                        logger.info("¡Rol de ADMIN encontrado en cliente para usuario: {}!", jwt.getSubject());
                    }
                });
            } else {
                logger.debug("No se encontraron roles para el cliente '{}' en el token JWT", CLIENT_ID);
            }
        } else {
            logger.debug("No se encontró información de 'resource_access' en el token JWT");
        }

        logger.info("Total de autoridades extraídas para usuario {}: {}", jwt.getSubject(), authorities.size());
        logger.debug("Autoridades resultantes: {}", authorities);
        return authorities;
    }
}