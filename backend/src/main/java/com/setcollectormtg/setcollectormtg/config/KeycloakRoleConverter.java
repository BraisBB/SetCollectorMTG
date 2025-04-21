package com.setcollectormtg.setcollectormtg.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    private static final String CLIENT_ID = "setcollector-app";

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();

        // Log para debugging
        System.out.println("JWT Token claims: " + jwt.getClaims());

        // Roles del realm
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            List<String> roles = (List<String>) realmAccess.get("roles");
            roles.forEach(roleName -> {
                // Convertir los roles de Keycloak a mayúsculas sin prefijo
                String authorityRole = roleName.toUpperCase();
                authorities.add(new SimpleGrantedAuthority(authorityRole));
                System.out.println("Convertido rol del realm: " + roleName + " a: " + authorityRole);
            });
        }

        // Roles del cliente específico
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            Map<String, Object> clientAccess = (Map<String, Object>) resourceAccess.get(CLIENT_ID);
            if (clientAccess != null && clientAccess.containsKey("roles")) {
                List<String> roles = (List<String>) clientAccess.get("roles");
                roles.forEach(roleName -> {
                    // Convertir los roles de Keycloak a mayúsculas sin prefijo
                    String authorityRole = roleName.toUpperCase();
                    authorities.add(new SimpleGrantedAuthority(authorityRole));
                    System.out.println("Convertido rol del cliente: " + roleName + " a: " + authorityRole);
                });
            }
        }

        // Log de las autoridades convertidas
        System.out.println("Autoridades convertidas: " + authorities);

        return authorities;
    }
}