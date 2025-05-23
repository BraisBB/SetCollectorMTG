package com.setcollectormtg.setcollectormtg.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequest {
    
    @NotBlank(message = "Username es requerido")
    private String username;
    
    @NotBlank(message = "Password es requerido")
    private String password;
} 