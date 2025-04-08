package com.setcollectormtg.setcollectormtg.config;

import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KeycloakAdminConfig {

    @Value("${keycloak.auth-server-url}")
    private String serverUrl;

    @Value("${keycloak.realm}")
    private String realm;

    // Propiedades del cliente CONFIDENCIAL con cuenta de servicio
    @Value("${keycloak.admin-client.client-id}")
    private String clientId;

    @Value("${keycloak.admin-client.client-secret}")
    private String clientSecret;

    @Bean
    public Keycloak keycloakAdmin() {
        // Este bean se usará para interactuar con la Admin API de Keycloak
        return KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm(realm) // Realm al que conectar
                .grantType(OAuth2Constants.CLIENT_CREDENTIALS) // Usar credenciales del cliente (cuenta de servicio)
                .clientId(clientId) // ID del cliente admin
                .clientSecret(clientSecret) // Secreto del cliente admin
                .build();
    }
}