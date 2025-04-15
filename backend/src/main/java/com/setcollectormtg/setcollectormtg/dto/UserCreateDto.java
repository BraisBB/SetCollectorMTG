package com.setcollectormtg.setcollectormtg.dto;

import com.setcollectormtg.setcollectormtg.validation.CapitalizedString;
import com.setcollectormtg.setcollectormtg.validation.StrongPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UserCreateDto {
    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 3, max = 20, message = "El nombre de usuario debe tener entre 3 y 20 caracteres")
    private String username;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es válido")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @StrongPassword
    private String password;

    @NotBlank(message = "El nombre es obligatorio")
    @CapitalizedString(message = "El nombre debe comenzar con mayúscula")
    private String firstName;

    @NotBlank(message = "El apellido es obligatorio")
    @CapitalizedString(message = "El apellido debe comenzar con mayúscula")
    private String lastName;

    private List<String> roles;
}