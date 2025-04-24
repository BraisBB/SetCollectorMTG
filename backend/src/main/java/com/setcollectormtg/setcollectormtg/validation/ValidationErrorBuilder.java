package com.setcollectormtg.setcollectormtg.validation;

public class ValidationErrorBuilder {
    
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