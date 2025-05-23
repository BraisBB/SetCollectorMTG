package com.setcollectormtg.setcollectormtg.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.multipart.MultipartResolver;
import org.springframework.web.multipart.support.StandardServletMultipartResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import jakarta.servlet.MultipartConfigElement;
import org.springframework.util.unit.DataSize;
import org.springframework.core.env.Environment;
import org.springframework.beans.factory.annotation.Autowired;

import lombok.extern.slf4j.Slf4j;

/**
 * Configuración global de Spring MVC.
 * 
 * Esta clase proporciona configuraciones para:
 * 1. Configuración CORS centralizada y completa
 * 2. Configuración para la carga de archivos
 * 3. Registrar interceptores, convertidores, formateadores, etc. si fueran
 * necesarios
 */
@Configuration
@Slf4j
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private Environment environment;

    /**
     * Configura CORS para permitir solicitudes desde el frontend
     * Esta configuración complementa la de SecurityConfig
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String activeProfile = environment.getProperty("spring.profiles.active", "default");
        boolean isDev = activeProfile.contains("dev") || activeProfile.equals("default");

        log.info("Configurando CORS para entorno: {}", isDev ? "DESARROLLO" : "PRODUCCIÓN");

        registry.addMapping("/**")
                .allowedOrigins(
                        "http://localhost:5173", // Frontend en desarrollo
                        "http://127.0.0.1:5173", // Frontend alternativo
                        "http://localhost:8080", // Aplicación completa en producción
                        "http://localhost", // Nginx en producción sin puerto
                        "http://setcollector-frontend", // Nombre de servicio en red Docker
                        "*" // Permitir cualquier origen para desarrollo
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("Origin", "Content-Type", "Accept", "Authorization",
                        "X-Requested-With", "X-CSRF-Token", "X-XSRF-Token",
                        "Cache-Control", "Pragma", "*")
                .exposedHeaders("Authorization", "Content-Disposition", "X-CSRF-Token", "Content-Type")
                .allowCredentials(false)
                .maxAge(3600);
    }

    /**
     * Configura el gestor de rutas para manejar tanto rutas con prefijo /api como
     * sin él
     */
    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        log.info("Configurando manejo de rutas con prefijo /api");
    }

    /**
     * Configura los límites de tamaño para la carga de archivos
     * 
     * @return MultipartConfigElement con la configuración
     */
    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();

        // Establecer tamaño máximo por archivo (10MB)
        factory.setMaxFileSize(DataSize.ofMegabytes(10));

        // Establecer tamaño máximo de la solicitud (10MB)
        factory.setMaxRequestSize(DataSize.ofMegabytes(10));

        return factory.createMultipartConfig();
    }

    /**
     * Resolver para procesar solicitudes multiparte (archivos)
     */
    @Bean
    public MultipartResolver multipartResolver() {
        return new StandardServletMultipartResolver();
    }
}