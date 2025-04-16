package com.setcollectormtg.setcollectormtg.dto;

import com.setcollectormtg.setcollectormtg.validation.CapitalizedString;
import com.setcollectormtg.setcollectormtg.validation.StrongPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UserCreateDto {
    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 3, max = 20, message = "El nombre de usuario debe tener entre 3 y 20 caracteres")
    @Pattern(regexp = "^[\\w\\-.*$@!%&]+$", message = "El nombre de usuario no puede contener espacios ni caracteres especiales como < > ( ) { } [ ] ; : ' \" , /")
    private String username;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es válido")
    @Size(max = 50, message = "El email no puede exceder los 50 caracteres")
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