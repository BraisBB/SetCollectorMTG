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

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "keycloak";
        String authUrl = authServerUrl + "/realms/" + realm + "/protocol/openid-connect/auth";
        String tokenUrl = authServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        return new OpenAPI()
                .info(new Info()
                        .title("SetCollectorMTG API")
                        .version("1.0")
                        .description("API para gestión de colecciones de cartas Magic: The Gathering"))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.OAUTH2)
                                        .flows(new OAuthFlows()
                                                .authorizationCode(new OAuthFlow()
                                                        .authorizationUrl(authUrl)
                                                        .tokenUrl(tokenUrl)
                                                        .scopes(new Scopes()
                                                                .addString("openid", "OpenID scope")
                                                                .addString("profile", "Profile scope")
                                                                .addString("email", "Email scope"))))));
    }
}