package com.setcollectormtg.setcollectormtg.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.core.env.Environment;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Configuración de seguridad principal de la aplicación.
 * <p>
 * Esta clase configura Spring Security para:
 * 1. Usar OAuth2/JWT como mecanismo de autenticación
 * 2. Definir rutas públicas y protegidas
 * 3. Configurar CORS y CSRF
 * 4. Habilitar seguridad a nivel de método con anotaciones
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Habilita @PreAuthorize, @PostAuthorize, @Secured, etc.
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    @Value("${keycloak.auth-server-url}")
    private String keycloakUrl;

    @Value("${keycloak.realm}")
    private String realm;
    
    // Inyectamos el filtro de sincronización
    private final AuthenticationSynchronizationFilter authSyncFilter;

    private final Environment environment;

    /**
     * Define la cadena de filtros de seguridad principal.
     *
     * @param http Configurador de seguridad HTTP
     * @return Cadena de filtros configurada
     * @throws Exception Si ocurre un error durante la configuración
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.info("Configurando seguridad en SecurityConfig");
        
        // Determinar el entorno para la configuración CORS
        String activeProfile = environment.getProperty("spring.profiles.active", "default");
        boolean isDev = activeProfile.contains("dev") || activeProfile.equals("default");
        
        if (isDev) {
            log.info("CORS configurado para entorno de DESARROLLO");
        } else {
            log.info("CORS configurado para entorno de PRODUCCIÓN");
        }
        
        // Convertidor para extraer roles del token JWT y mapearlos a authorities de Spring Security
        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(new KeycloakRoleConverter());

        // Configurar repositorio CSRF con dominio explícito para cookies
        CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokenRepository.setCookiePath("/");

        http
                // Deshabilitar CSRF para APIs RESTful
                .csrf(csrf -> csrf.disable())
                
                // Configurar CORS para permitir peticiones del frontend
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                
                // Configurar manejo de sesiones sin estado (no guardar sesión)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                
                // Configurar reglas de autorización para URLs
                .authorizeHttpRequests(authorize -> authorize
                        // Rutas públicas (sin autenticación)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/", "/actuator/**", "/health/**").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        
                        // Permitir registro de usuarios sin autenticación
                        .requestMatchers(HttpMethod.POST, "/users").permitAll()
                        .requestMatchers(HttpMethod.POST, "/users/").permitAll()
                        
                        // Permitir operaciones específicas en /users sin autenticación (para registro)
                        .requestMatchers(HttpMethod.GET, "/users/username/**").permitAll() // Verificar username
                        
                        // El resto de operaciones en /users requieren autenticación
                        .requestMatchers("/users/**").authenticated()
                        
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/public/**").permitAll()
                        
                        // Rutas protegidas con roles específicos
                        .requestMatchers("/admin/**").hasAuthority("ADMIN")
                        
                        // Todo lo demás requiere autenticación
                        .anyRequest().authenticated()
                )
                
                // Configurar autenticación con OAuth2 Resource Server (JWT)
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
                )
                
                // Agregar filtro personalizado para OPTIONS preflight con configuración explícita de Content-Type
                .addFilterBefore(new OncePerRequestFilter() {
                    @Override
                    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) 
                            throws ServletException, IOException {
                        // Si es una solicitud OPTIONS, establecer encabezados CORS y finalizar
                        if (request.getMethod().equals(HttpMethod.OPTIONS.name())) {
                            response.setHeader("Access-Control-Allow-Origin", "*");
                            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                            response.setHeader("Access-Control-Allow-Headers", 
                                    "Authorization, Content-Type, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers");
                            response.setHeader("Access-Control-Allow-Credentials", "true");
                            response.setHeader("Access-Control-Max-Age", "3600");
                            response.setStatus(HttpServletResponse.SC_OK);
                            return;
                        }
                        filterChain.doFilter(request, response);
                    }
                }, CorsFilter.class)
                
                // Agregar filtro personalizado para sincronizar usuario autenticado
                .addFilterBefore(authSyncFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Configuración de CORS para permitir peticiones desde el frontend.
     *
     * @return Fuente de configuración CORS basada en URL
     */
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = corsConfigurationSource();
        return new CorsFilter(source);
    }

    /**
     * Crea la fuente de configuración CORS.
     *
     * @return Fuente de configuración CORS
     */
    private UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Configuración basada en entorno (desarrollo vs producción)
        if (System.getProperty("spring.profiles.active", "").contains("dev")) {
            // Desarrollo: Permitir orígenes específicos
            configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
                "http://localhost:8080",
                "http://host.containers.internal:5173"
            ));
            // Permitir más información en logs para debugging
            log.info("CORS configurado para entorno de DESARROLLO");
        } else {
            // Producción: Ajustar según necesidad
            configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:5173",
                "http://localhost:8080", 
                "http://localhost:8181"
            ));
            log.info("CORS configurado para entorno de PRODUCCIÓN");
        }
        
        // Configuración común para todos los entornos
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList(
            "Origin", 
            "Content-Type", 
            "Accept", 
            "Authorization", 
            "X-Requested-With", 
            "Access-Control-Request-Method", 
            "Access-Control-Request-Headers",
            "X-CSRF-Token",
            "X-XSRF-Token"
        ));
        
        // Importante para autenticación
        configuration.setAllowCredentials(true);
        
        configuration.setExposedHeaders(Arrays.asList(
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Credentials",
            "Authorization",
            "Content-Disposition"
        ));
        
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}