package com.setcollectormtg.setcollectormtg.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("SetCollectorMTG API")
                        .version("1.0")
                        .description("API para gestión de colecciones de cartas Magic: The Gathering"));
    }
}