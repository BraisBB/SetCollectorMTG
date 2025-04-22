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

        // Validate length
        if (password.length() < 8 || password.length() > 16) {
            context.buildConstraintViolationWithTemplate(
                "Password must be between 8 and 16 characters")
                .addConstraintViolation();
            isValid = false;
        }

        // Validate spaces
        if (password.contains(" ")) {
            context.buildConstraintViolationWithTemplate(
                "Password cannot contain spaces")
                .addConstraintViolation();
            isValid = false;
        }

        // Validate uppercase
        if (!password.matches(".*[A-Z].*")) {
            context.buildConstraintViolationWithTemplate(
                "Password must contain at least one uppercase letter")
                .addConstraintViolation();
            isValid = false;
        }

        // Validate lowercase
        if (!password.matches(".*[a-z].*")) {
            context.buildConstraintViolationWithTemplate(
                "Password must contain at least one lowercase letter")
                .addConstraintViolation();
            isValid = false;
        }

        // Validate number
        if (!password.matches(".*\\d.*")) {
            context.buildConstraintViolationWithTemplate(
                "Password must contain at least one number")
                .addConstraintViolation();
            isValid = false;
        }

        // Validate special character
        if (!password.matches(".*[!@?./#$%].*")) {
            context.buildConstraintViolationWithTemplate(
                "Password must contain at least one special character (!@?./#$%)")
                .addConstraintViolation();
            isValid = false;
        }

        return isValid;
    }
}