package com.setcollectormtg.setcollectormtg.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de Swagger/OpenAPI para la documentación interactiva de la API.
 *
 * Define el esquema de seguridad JWT Bearer Token para autenticación simple
 * y expone la información básica de la API Set Collector MTG.
 * Permite probar endpoints protegidos usando autenticación Bearer Token desde
 * Swagger UI.
 */
@Configuration
public class SwaggerConfig {

        @Bean
        public OpenAPI customOpenAPI() {
                return new OpenAPI()
                                .info(new Info()
                                                .title("Set Collector MTG API")
                                                .version("2.0")
                                                .description("API REST para gestión de colecciones de cartas Magic: The Gathering. "
                                                                + "Sistema de autenticación JWT simple integrado. "
                                                                + "\n\n**Uso:**\n"
                                                                + "1. Registrarse en `/auth/register`\n"
                                                                + "2. Hacer login en `/auth/login` para obtener el token JWT\n"
                                                                + "3. Usar el token en el header Authorization: `Bearer <token>`\n"
                                                                + "4. El botón 'Authorize' permite configurar el token para todas las peticiones")
                                                .contact(new Contact()
                                                                .name("Set Collector MTG")
                                                                .url("https://github.com/setcollectormtg")
                                                                .email("admin@setcollector.com")))
                                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                                .components(new Components()
                                                .addSecuritySchemes("Bearer Authentication",
                                                                new SecurityScheme()
                                                                                .type(SecurityScheme.Type.HTTP)
                                                                                .scheme("bearer")
                                                                                .bearerFormat("JWT")
                                                                                .description("Token JWT obtenido del endpoint /auth/login. "
                                                                                                + "Debe incluirse en el header Authorization: Bearer <token>")));
        }
}