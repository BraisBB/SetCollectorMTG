package com.setcollectormtg.setcollectormtg.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    private static final String ROLE_PREFIX = "ROLE_";
    private static final String CLIENT_ID = "setcollector-app"; // Reemplaza con tu client ID

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();

        // Roles del realm
        authorities.addAll(extractRealmRoles(jwt));

        // Roles del cliente específico
        authorities.addAll(extractClientRoles(jwt, CLIENT_ID));

        return authorities;
    }

    private Collection<? extends GrantedAuthority> extractRealmRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        return Optional.ofNullable(realmAccess)
                .map(ra -> (List<String>) ra.get("roles"))
                .orElse(Collections.emptyList())
                .stream()
                .map(role -> ROLE_PREFIX + role.toUpperCase())
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    private Collection<? extends GrantedAuthority> extractClientRoles(Jwt jwt, String clientId) {
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        return Optional.ofNullable(resourceAccess)
                .map(ra -> (Map<String, Object>) ra.get(clientId))
                .map(client -> (List<String>) client.get("roles"))
                .orElse(Collections.emptyList())
                .stream()
                .map(role -> ROLE_PREFIX + role.toUpperCase())
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }
}