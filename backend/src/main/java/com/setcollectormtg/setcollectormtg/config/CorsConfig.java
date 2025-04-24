package com.setcollectormtg.setcollectormtg.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


/**
 * Configuración global de CORS para la aplicación Spring Boot.
 *
 * Permite solicitudes desde los orígenes del frontend (localhost:5173 y localhost:3000),
 * habilitando los métodos y encabezados necesarios para la integración frontend-backend
 * durante el desarrollo. Permite el envío de credenciales (cookies, headers de autenticación).
 */
@Configuration
public class CorsConfig {
    /**
     * Define la configuración de CORS para todas las rutas de la API.
     *
     * Permite orígenes específicos, métodos HTTP comunes y el uso de credenciales.
     *
     * @return WebMvcConfigurer con la configuración de CORS aplicada
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // "/**" ya cubre todas las rutas desde la raíz, perfecto.
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:5173", "http://localhost:3000") // Tus orígenes de frontend
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}