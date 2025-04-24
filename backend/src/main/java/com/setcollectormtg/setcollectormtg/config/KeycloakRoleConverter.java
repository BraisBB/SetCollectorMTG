package com.setcollectormtg.setcollectormtg.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

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

    /**
     * Extrae los roles del JWT (realm y cliente) y los convierte en autoridades de Spring Security.
     *
     * @param jwt Token JWT recibido desde Keycloak
     * @return Colección de GrantedAuthority con los roles extraídos
     */
    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();


        // Roles del realm
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            List<String> roles = (List<String>) realmAccess.get("roles");
            roles.forEach(roleName -> {
               
                String authorityRole = roleName.toUpperCase();
                authorities.add(new SimpleGrantedAuthority(authorityRole));
            });
        }

        // Roles del cliente específico
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            Map<String, Object> clientAccess = (Map<String, Object>) resourceAccess.get(CLIENT_ID);
            if (clientAccess != null && clientAccess.containsKey("roles")) {
                List<String> roles = (List<String>) clientAccess.get("roles");
                roles.forEach(roleName -> {
                    
                    String authorityRole = roleName.toUpperCase();
                    authorities.add(new SimpleGrantedAuthority(authorityRole));
                });
            }
        } 

        return authorities;
    }
}