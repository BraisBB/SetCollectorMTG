package com.setcollectormtg.setcollectormtg.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth-test")
@Slf4j
public class AuthTestController {

    @GetMapping("/public")
    public ResponseEntity<Map<String, Object>> publicEndpoint() {
        log.info("Accediendo a endpoint público de prueba");
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Este es un endpoint público");
        response.put("authenticated", false);
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            response.put("authenticated", true);
            response.put("username", auth.getName());
            response.put("authorities", auth.getAuthorities().stream()
                    .map(a -> a.getAuthority())
                    .collect(Collectors.toList()));
        }
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/user")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER', 'ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> userEndpoint() {
        log.info("Accediendo a endpoint protegido para USUARIOS");
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Acceso exitoso como USUARIO");
        response.put("authenticated", true);
        response.put("username", auth.getName());
        response.put("authorities", auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .collect(Collectors.toList()));
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/admin")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> adminEndpoint() {
        log.info("Accediendo a endpoint protegido para ADMINISTRADORES");
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Acceso exitoso como ADMINISTRADOR");
        response.put("authenticated", true);
        response.put("username", auth.getName());
        response.put("authorities", auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .collect(Collectors.toList()));
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> authInfo() {
        log.info("Obteniendo información de autenticación actual");
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> response = new HashMap<>();
        response.put("authenticated", auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser"));
        
        if (auth != null) {
            response.put("principal", auth.getPrincipal());
            response.put("name", auth.getName());
            response.put("credentials", auth.getCredentials() != null ? "PRESENT" : "NONE");
            response.put("authorities", auth.getAuthorities().stream()
                    .map(a -> a.getAuthority())
                    .collect(Collectors.toList()));
            response.put("details", auth.getDetails());
        }
        
        return ResponseEntity.ok(response);
    }
} 