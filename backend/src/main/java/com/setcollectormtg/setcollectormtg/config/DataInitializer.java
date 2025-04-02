package com.setcollectormtg.setcollectormtg.config;


import com.setcollectormtg.setcollectormtg.service.CardImportService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner importInitialData(CardImportService cardImportService) {
        return args -> {
            try {
                // Ruta relativa desde resources
                String jsonPath = "src/main/resources/FDN.json";
                cardImportService.importSetFromJson(jsonPath);
                System.out.println("✅ Datos importados exitosamente!");
            } catch (Exception e) {
                System.err.println("❌ Error al importar datos: " + e.getMessage());
            }
        };
    }
}