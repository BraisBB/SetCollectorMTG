package com.setcollectormtg.setcollectormtg.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.Set;

@Data
public class UserDto {
    private Long userId;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private LocalDate joinDate;
    private Set<String> roles;
    private Boolean enabled;
    // No tiene contraseña por seguridad
}