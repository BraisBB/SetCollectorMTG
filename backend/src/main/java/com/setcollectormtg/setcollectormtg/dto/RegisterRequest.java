package com.setcollectormtg.setcollectormtg.dto;

import com.setcollectormtg.setcollectormtg.validation.CapitalizedString;
import com.setcollectormtg.setcollectormtg.validation.StrongPassword;
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
    
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 20, message = "Username must be between 3 and 20 characters")
    private String username;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email must have a valid format")
    private String email;
    
    @NotBlank(message = "Password is required")
    @StrongPassword
    private String password;
    
    @NotBlank(message = "First name is required")
    @CapitalizedString(message = "First name must start with a capital letter")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    @CapitalizedString(message = "Last name must start with a capital letter")
    private String lastName;
} 