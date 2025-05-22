package com.setcollectormtg.setcollectormtg.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.multipart.MultipartResolver;
import org.springframework.web.multipart.support.StandardServletMultipartResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import jakarta.servlet.MultipartConfigElement;
import org.springframework.util.unit.DataSize;

/**
 * Configuración global de Spring MVC.
 * 
 * Esta clase proporciona configuraciones para:
 * 1. Configuración para la carga de archivos
 * 2. Registrar interceptores, convertidores, formateadores, etc. si fueran necesarios
 * 
 * Nota: La configuración CORS ha sido centralizada en SecurityConfig
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    
    /**
     * Configura los límites de tamaño para la carga de archivos
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