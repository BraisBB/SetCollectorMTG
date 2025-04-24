package com.setcollectormtg.setcollectormtg.config;

/**
 * Configuración principal de seguridad para la aplicación Set Collector MTG.
 *
 * Define las reglas de acceso a los endpoints, la integración con OAuth2/Keycloak,
 * la política de sesiones y la conversión de roles JWT para Spring Security.
 * Permite acceso público a la documentación Swagger, consola H2 y endpoints de cartas y sets.
 * Protege los endpoints de usuarios, colecciones y mazos, delegando la gestión de roles a anotaciones.
 */
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;


@Configuration
@EnableWebSecurity
@EnableMethodSecurity(jsr250Enabled = true, prePostEnabled = true)
public class SecurityConfig {

    /**
     * Convierte los roles de Keycloak presentes en el JWT a autoridades de Spring Security.
     */
    private final KeycloakRoleConverter keycloakRoleConverter;

    /**
     * Inyección del conversor de roles de Keycloak.
     * @param keycloakRoleConverter conversor de roles personalizado
     */
    public SecurityConfig(KeycloakRoleConverter keycloakRoleConverter) {
        this.keycloakRoleConverter = keycloakRoleConverter;
    }

    /**
     * Configura la cadena de filtros de seguridad de Spring Security.
     *
     * - Deshabilita CSRF (por ser API stateless)
     * - Define endpoints públicos y protegidos
     * - Configura la política de sesión como STATELESS
     * - Integra OAuth2 Resource Server con JWT y conversión de roles
     *
     * @param http objeto de configuración de seguridad HTTP
     * @return SecurityFilterChain configurado
     * @throws Exception en caso de error de configuración
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Endpoints públicos
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/h2-console/**",
                                "/users", // POST será manejado por anotación
                                "/cards/**", // Permitir acceso público a los endpoints de cartas
                                "/sets/**" // Permitir acceso público a los endpoints de sets
                        ).permitAll()

                        // Configuración básica para endpoints protegidos
                        .requestMatchers("/users/**", "/collections/**", "/decks/**").authenticated()

                        // Permite acceso a todos los métodos autenticados (las anotaciones manejarán los roles)
                        .anyRequest().authenticated()
                )
                .headers(headers -> headers
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin)
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())
                        )
                );

        return http.build();
    }

    /**
     * Configura el conversor de JWT para extraer los roles de Keycloak y mapearlos a autoridades de Spring Security.
     *
     * @return JwtAuthenticationConverter personalizado
     */
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(new KeycloakRoleConverter());
        return converter;
    }
}