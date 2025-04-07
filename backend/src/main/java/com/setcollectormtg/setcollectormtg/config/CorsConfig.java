package com.setcollectormtg.setcollectormtg.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins(
                                "http://localhost:5173",  // Frontend principal
                                "http://localhost:3000",   // Alternativa React
                                "http://127.0.0.1:5173"    // Para evitar problemas de localhost
                        )
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                        .allowedHeaders("*")
                        .exposedHeaders(
                                "Authorization",
                                "Content-Type",
                                "Content-Disposition"
                        )
                        .allowCredentials(true)
                        .maxAge(3600);
            }
        };
    }
}