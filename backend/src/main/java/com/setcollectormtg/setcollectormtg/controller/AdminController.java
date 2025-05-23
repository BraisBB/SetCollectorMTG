package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.service.CardImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final CardImportService cardImportService;

    /**
     * Endpoint para subir un archivo JSON con cartas y procesarlo
     * Solo accesible para administradores
     */
    @PostMapping(value = "/cards/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> importCardsFromJson(@RequestParam("file") MultipartFile file) {
        log.info("Recibida solicitud para importar cartas desde archivo JSON: {}", file.getOriginalFilename());
        Map<String, Object> response = new HashMap<>();
        
        // Validaciones iniciales
        if (file.isEmpty()) {
            log.warn("Se intentó subir un archivo vacío");
            response.put("success", false);
            response.put("message", "Please select a file to upload");
            return ResponseEntity.badRequest().body(response);
        }

        // Verificar que es un archivo JSON
        if (!file.getOriginalFilename().toLowerCase().endsWith(".json")) {
            log.warn("Se intentó subir un archivo que no es JSON: {}", file.getOriginalFilename());
            response.put("success", false);
            response.put("message", "Only JSON files are allowed");
            return ResponseEntity.badRequest().body(response);
        }
        
        Path tempFilePath = null;
        try {
            // Crear un archivo temporal para guardar el JSON
            String filename = UUID.randomUUID().toString() + ".json";
            tempFilePath = Paths.get(System.getProperty("java.io.tmpdir"), filename);
            Files.write(tempFilePath, file.getBytes());
            
            log.info("Archivo guardado temporalmente en: {}", tempFilePath);
            log.info("Tamaño del archivo: {} bytes", file.getSize());
            
            // Procesar el archivo JSON
            cardImportService.importSetFromJson(tempFilePath.toString());
            
            log.info("Importación completada con éxito");
            
            response.put("success", true);
            response.put("message", "Cards imported successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error al importar cartas: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Error importing cards: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } finally {
            // Eliminar el archivo temporal si existe
            if (tempFilePath != null) {
                try {
                    Files.deleteIfExists(tempFilePath);
                    log.info("Archivo temporal eliminado: {}", tempFilePath);
                } catch (IOException e) {
                    log.warn("No se pudo eliminar el archivo temporal: {}", tempFilePath, e);
                }
            }
        }
    }
} 