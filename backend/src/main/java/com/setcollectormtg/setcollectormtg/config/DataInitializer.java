package com.setcollectormtg.setcollectormtg.config;

import com.setcollectormtg.setcollectormtg.repository.SetMtgRepository;
import com.setcollectormtg.setcollectormtg.service.CardImportService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

@Slf4j
@Configuration
public class DataInitializer {

    @Bean
    @Order(1)
    public CommandLineRunner importInitialData(CardImportService cardImportService, SetMtgRepository setMtgRepository) {
        return args -> {
            try {
                log.info("Iniciando importación de datos iniciales...");
                
                // Ruta relativa desde resources
                String jsonPath = "src/main/resources/FDN.json";
                String setCode = "FDN";
                
                // Verificar si el set ya existe
                if (!setMtgRepository.existsBySetCode(setCode)) {
                    log.info("Importando set {} desde {}", setCode, jsonPath);
                    cardImportService.importSetFromJson(jsonPath);
                    log.info("✅ Datos importados exitosamente!");
                } else {
                    log.info("ℹ️ El set {} ya existe en la base de datos.", setCode);
                }
            } catch (Exception e) {
                log.error("❌ Error al importar datos: {}", e.getMessage(), e);
            }
        };
    }
}