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

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        log.info("Intento de login para usuario: {}", request.getUsername());
        try {
            AuthResponse response = authService.login(request);
            log.info("Login exitoso para usuario: {}", request.getUsername());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error en login para usuario: {}", request.getUsername(), e);
            throw e;
        }
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Intento de registro para usuario: {}", request.getUsername());
        try {
            AuthResponse response = authService.register(request);
            log.info("Registro exitoso para usuario: {}", request.getUsername());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error en registro para usuario: {}", request.getUsername(), e);
            throw e;
        }
    }
} 