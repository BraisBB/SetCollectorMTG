package com.setcollectormtg.setcollectormtg.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    
    @NotBlank(message = "Username es requerido")
    @Size(min = 3, max = 20, message = "Username debe tener entre 3 y 20 caracteres")
    private String username;
    
    @NotBlank(message = "Email es requerido")
    @Email(message = "Email debe tener un formato válido")
    private String email;
    
    @NotBlank(message = "Password es requerido")
    @Size(min = 6, message = "Password debe tener al menos 6 caracteres")
    private String password;
    
    @NotBlank(message = "Nombre es requerido")
    private String firstName;
    
    @NotBlank(message = "Apellido es requerido")
    private String lastName;
} 