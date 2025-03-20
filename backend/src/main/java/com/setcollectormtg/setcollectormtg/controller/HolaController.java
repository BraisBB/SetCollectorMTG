package com.setcollectormtg.setcollectormtg.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173") // Permite solicitudes desde el frontend
public class HolaController {

    @GetMapping("/hola")
    public String decirHola() {
        return "Hola desde el backend!";
    }
}