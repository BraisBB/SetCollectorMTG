package com.setcollectormtg.setcollectormtg.validation;

/**
 * Utility class for building consistent validation error messages.
 * Provides static methods to generate standardized error messages for various
 * validation scenarios.
 */
public class ValidationErrorBuilder {

    /**
     * Builds a comprehensive password validation error message.
     * Validates password strength requirements including length, character types,
     * and restrictions.
     * 
     * @param password The password to validate
     * @return A detailed error message or null if password is valid
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
     * Builds a validation error message for fields that must start with a capital
     * letter.
     * 
     * @param value     The string value to validate
     * @param fieldName The name of the field being validated
     * @return An error message or null if the value is valid
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