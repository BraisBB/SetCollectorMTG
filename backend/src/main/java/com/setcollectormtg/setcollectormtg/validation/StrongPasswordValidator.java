package com.setcollectormtg.setcollectormtg.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

    @Override
    public void initialize(StrongPassword constraintAnnotation) {
    }

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null) {
            return false;
        }

        context.disableDefaultConstraintViolation();
        boolean isValid = true;

        // Validar longitud
        if (password.length() < 8 || password.length() > 16) {
            context.buildConstraintViolationWithTemplate(
                "La contraseña debe tener entre 8 y 16 caracteres")
                .addConstraintViolation();
            isValid = false;
        }

        // Validar espacios
        if (password.contains(" ")) {
            context.buildConstraintViolationWithTemplate(
                "La contraseña no puede contener espacios")
                .addConstraintViolation();
            isValid = false;
        }

        // Validar mayúscula
        if (!password.matches(".*[A-Z].*")) {
            context.buildConstraintViolationWithTemplate(
                "La contraseña debe contener al menos una letra mayúscula")
                .addConstraintViolation();
            isValid = false;
        }

        // Validar minúscula
        if (!password.matches(".*[a-z].*")) {
            context.buildConstraintViolationWithTemplate(
                "La contraseña debe contener al menos una letra minúscula")
                .addConstraintViolation();
            isValid = false;
        }

        // Validar número
        if (!password.matches(".*\\d.*")) {
            context.buildConstraintViolationWithTemplate(
                "La contraseña debe contener al menos un número")
                .addConstraintViolation();
            isValid = false;
        }

        // Validar carácter especial
        if (!password.matches(".*[!@?./#$%].*")) {
            context.buildConstraintViolationWithTemplate(
                "La contraseña debe contener al menos un carácter especial (!@?./#$%)")
                .addConstraintViolation();
            isValid = false;
        }

        return isValid;
    }
}