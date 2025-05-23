package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.AuthRequest;
import com.setcollectormtg.setcollectormtg.dto.AuthResponse;
import com.setcollectormtg.setcollectormtg.dto.RegisterRequest;
import com.setcollectormtg.setcollectormtg.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

/**
 * Controlador de autenticación con prefijo /api
 * Este controlador duplica la funcionalidad de AuthController
 * para dar soporte a las rutas con prefijo /api/auth/
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:5173")
public class ApiAuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        log.info("Intento de login (API) para usuario: {}", request.getUsername());
        try {
            AuthResponse response = authService.login(request);
            log.info("Login exitoso (API) para usuario: {}", request.getUsername());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error en login (API) para usuario: {}", request.getUsername(), e);
            throw e;
        }
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Intento de registro (API) para usuario: {}", request.getUsername());
        try {
            AuthResponse response = authService.register(request);
            log.info("Registro exitoso (API) para usuario: {}", request.getUsername());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error en registro (API) para usuario: {}", request.getUsername(), e);
            throw e;
        }
    }
} 