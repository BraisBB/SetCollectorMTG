package com.setcollectormtg.setcollectormtg.validation;

/**
 * Clase de utilidad para construir mensajes de error de validación consistentes.
 * Proporciona métodos estáticos para generar mensajes de error estandarizados para varios
 * escenarios de validación.
 */
public class ValidationErrorBuilder {

    /**
     * Construye un mensaje de error de validación de contraseña completo.
     * Valida los requisitos de fortaleza de la contraseña incluyendo longitud, tipos de caracteres,
     * y restricciones.
     * 
     * @param password La contraseña a validar
     * @return Un mensaje de error detallado o null si la contraseña es válida
     */
    public static String buildPasswordValidationError(String password) {
        StringBuilder error = new StringBuilder();

        if (password == null || password.isEmpty()) {
            return "Password is required";
        }

        if (password.length() < 8 || password.length() > 16) {
            error.append("Password must be between 8 and 16 characters. ");
        }

        if (password.contains(" ")) {
            error.append("Password cannot contain spaces. ");
        }

        if (!password.matches(".*[A-Z].*")) {
            error.append("Password must contain at least one uppercase letter. ");
        }

        if (!password.matches(".*[a-z].*")) {
            error.append("Password must contain at least one lowercase letter. ");
        }

        if (!password.matches(".*\\d.*")) {
            error.append("Password must contain at least one number. ");
        }

        if (!password.matches(".*[!@?./#$%].*")) {
            error.append("Password must contain at least one special character (!@?./#$%). ");
        }

        return error.length() > 0 ? error.toString().trim() : null;
    }

    /**
     * Construye un mensaje de error de validación para campos que deben comenzar con una letra
     * mayúscula.
     * 
     * @param value     El valor de cadena a validar
     * @param fieldName El nombre del campo que se está validando
     * @return Un mensaje de error o null si el valor es válido
     */
    public static String buildCapitalizedValidationError(String value, String fieldName) {
        if (value == null || value.isEmpty()) {
            return null;
        }

        if (!Character.isUpperCase(value.charAt(0))) {
            return String.format("The field %s must start with a capital letter", fieldName);
        }

        return null;
    }
}