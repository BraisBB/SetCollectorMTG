package com.setcollectormtg.setcollectormtg.validation;

public class ValidationErrorBuilder {
    
    public static String buildPasswordValidationError(String password) {
        StringBuilder error = new StringBuilder();
        
        if (password == null || password.isEmpty()) {
            return "La contraseña es obligatoria";
        }

        if (password.length() < 8 || password.length() > 16) {
            error.append("La contraseña debe tener entre 8 y 16 caracteres. ");
        }

        if (password.contains(" ")) {
            error.append("La contraseña no puede contener espacios. ");
        }

        if (!password.matches(".*[A-Z].*")) {
            error.append("La contraseña debe contener al menos una letra mayúscula. ");
        }

        if (!password.matches(".*[a-z]..*")) {
            error.append("La contraseña debe contener al menos una letra minúscula. ");
        }

        if (!password.matches(".*\\d.*")) {
            error.append("La contraseña debe contener al menos un número. ");
        }

        if (!password.matches(".*[!@?./#$%].*")) {
            error.append("La contraseña debe contener al menos un carácter especial (!@?./#$%). ");
        }

        return error.length() > 0 ? error.toString().trim() : null;
    }

    public static String buildCapitalizedValidationError(String value, String fieldName) {
        if (value == null || value.isEmpty()) {
            return null; // La validación @NotBlank se encargará de este caso
        }
        
        if (!Character.isUpperCase(value.charAt(0))) {
            return String.format("El campo %s debe comenzar con mayúscula", fieldName);
        }

        return null; // Si pasa la validación, no hay error
    }
}