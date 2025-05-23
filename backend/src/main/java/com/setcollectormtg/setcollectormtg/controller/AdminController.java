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
     * Endpoint to upload a JSON file with cards and process it.
     * Only accessible for administrators.
     */
    @PostMapping(value = "/cards/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Map<String, Object>> importCardsFromJson(@RequestParam("file") MultipartFile file) {
        log.info("Request received to import cards from JSON file: {}", file.getOriginalFilename());
        Map<String, Object> response = new HashMap<>();
        
        // Initial validations
        if (file.isEmpty()) {
            log.warn("Attempt to upload empty file");
            response.put("success", false);
            response.put("message", "Please select a file to upload");
            return ResponseEntity.badRequest().body(response);
        }

        // Verify it's a JSON file
        if (!file.getOriginalFilename().toLowerCase().endsWith(".json")) {
            log.warn("Attempt to upload non-JSON file: {}", file.getOriginalFilename());
            response.put("success", false);
            response.put("message", "Only JSON files are allowed");
            return ResponseEntity.badRequest().body(response);
        }
        
        Path tempFilePath = null;
        try {
            // Create a temporary file to save the JSON
            String filename = UUID.randomUUID().toString() + ".json";
            tempFilePath = Paths.get(System.getProperty("java.io.tmpdir"), filename);
            Files.write(tempFilePath, file.getBytes());
            
            log.info("File temporarily saved at: {}", tempFilePath);
            log.info("File size: {} bytes", file.getSize());
            
            // Process the JSON file
            cardImportService.importSetFromJson(tempFilePath.toString());
            
            log.info("Import completed successfully");
            
            response.put("success", true);
            response.put("message", "Cards imported successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error importing cards: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Error importing cards: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } finally {
            // Delete temporary file if it exists
            if (tempFilePath != null) {
                try {
                    Files.deleteIfExists(tempFilePath);
                    log.info("Temporary file deleted: {}", tempFilePath);
                } catch (IOException e) {
                    log.warn("Could not delete temporary file: {}", tempFilePath, e);
                }
            }
        }
    }
} 