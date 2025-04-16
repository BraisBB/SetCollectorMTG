package com.setcollectormtg.setcollectormtg.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.OAuthFlow;
import io.swagger.v3.oas.models.security.OAuthFlows;
import io.swagger.v3.oas.models.security.Scopes;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Value("${keycloak.auth-server-url}")
    private String authServerUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.resource}")
    private String clientId;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("API de Set Collector MTG")
                        .version("1.0")
                        .description("API para gestionar colecciones de cartas Magic: The Gathering"))
                .addSecurityItem(new SecurityRequirement().addList("keycloak_oauth"))
                .components(new Components()
                        .addSecuritySchemes("keycloak_oauth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.OAUTH2)
                                        .flows(new OAuthFlows()
                                                .password(new OAuthFlow()
                                                        .tokenUrl(authServerUrl + "/realms/" + realm + "/protocol/openid-connect/token")
                                                        .refreshUrl(authServerUrl + "/realms/" + realm + "/protocol/openid-connect/token")
                                                        .scopes(new Scopes()))
                                                .clientCredentials(new OAuthFlow()
                                                        .tokenUrl(authServerUrl + "/realms/" + realm + "/protocol/openid-connect/token")
                                                        .scopes(new Scopes()))
                                                .authorizationCode(new OAuthFlow()
                                                        .authorizationUrl(authServerUrl + "/realms/" + realm + "/protocol/openid-connect/auth")
                                                        .tokenUrl(authServerUrl + "/realms/" + realm + "/protocol/openid-connect/token")
                                                        .refreshUrl(authServerUrl + "/realms/" + realm + "/protocol/openid-connect/token")
                                                        .scopes(new Scopes())))));
    }
}