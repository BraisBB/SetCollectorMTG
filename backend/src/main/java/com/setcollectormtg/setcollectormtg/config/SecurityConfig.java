package com.setcollectormtg.setcollectormtg.config;

// Asegúrate de tener las importaciones necesarias
// import org.springframework.beans.factory.annotation.Value; // Ya no es necesaria
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Ya no necesitamos inyectar contextPath
    // @Value("${server.servlet.context-path:/}")
    // private String contextPath;

    private final KeycloakRoleConverter keycloakRoleConverter;

    public SecurityConfig(KeycloakRoleConverter keycloakRoleConverter) {
        this.keycloakRoleConverter = keycloakRoleConverter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Las rutas ahora son relativas a la raíz "/"

        http
                // CORS manejado globalmente en CorsConfig
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Configuración de autorización - ¡RUTAS ACTUALIZADAS SIN /api!
                .authorizeHttpRequests(auth -> auth
                        // Permite Swagger y OpenAPI directamente en la raíz
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        // Permite H2 Console directamente en la raíz
                        .requestMatchers("/h2-console/**").permitAll() // ¡SOLO DESARROLLO!
                        // Permite rutas públicas directamente en /public/**
                        .requestMatchers("/public/**").permitAll()
                        // Requiere rol USER para /users/**
                        .requestMatchers("/users/**").hasRole("USER")
                        // Requiere rol ADMIN para /admin/**
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        // Cualquier otra petición ("/**") debe estar autenticada
                        .anyRequest().authenticated() // Se aplica a todo lo demás
                )
                .headers(headers -> headers
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin) // Para H2 Console
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())
                        )
                );

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(keycloakRoleConverter);
        return converter;
    }
}