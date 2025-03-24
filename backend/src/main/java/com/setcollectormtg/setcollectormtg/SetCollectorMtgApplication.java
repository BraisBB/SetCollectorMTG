package com.setcollectormtg.setcollectormtg;

import com.setcollectormtg.setcollectormtg.service.MTGJsonImportService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.beans.factory.annotation.Autowired;

@SpringBootApplication
public class SetCollectorMtgApplication implements CommandLineRunner {

    @Autowired
    private MTGJsonImportService mtgJsonImportService;

    public static void main(String[] args) {
        SpringApplication.run(SetCollectorMtgApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        // Ruta al archivo JSON descargado
        String filePath = "src/main/resources/FDN.json";
        mtgJsonImportService.importSetFromJson(filePath);
    }
}