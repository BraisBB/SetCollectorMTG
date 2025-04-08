package com.setcollectormtg.setcollectormtg.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();

        // Extract realm roles
        Map<String, Object> realmAccess = (Map<String, Object>) jwt.getClaims().get("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            List<String> roles = (List<String>) realmAccess.get("roles");
            authorities.addAll(roles.stream()
                    .map(roleName -> "ROLE_" + roleName.toUpperCase())
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList()));
        }

        // Extract resource roles (client roles)
        Map<String, Object> resourceAccess = (Map<String, Object>) jwt.getClaims().get("resource_access");
        if (resourceAccess != null) {
            for (String resourceKey : resourceAccess.keySet()) {
                Map<String, Object> resource = (Map<String, Object>) resourceAccess.get(resourceKey);
                if (resource.containsKey("roles")) {
                    List<String> clientRoles = (List<String>) resource.get("roles");
                    authorities.addAll(clientRoles.stream()
                            .map(roleName -> "ROLE_" + roleName.toUpperCase())
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList()));
                }
            }
        }

        return authorities;
    }
}