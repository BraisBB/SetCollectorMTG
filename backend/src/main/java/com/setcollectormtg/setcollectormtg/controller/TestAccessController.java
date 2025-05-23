package com.setcollectormtg.setcollectormtg.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/test-access")
@Slf4j
public class TestAccessController {

    @GetMapping("/public")
    public ResponseEntity<Map<String, Object>> publicTest() {
        log.info("Acceso a endpoint público de prueba");
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Acceso público exitoso");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }
} 