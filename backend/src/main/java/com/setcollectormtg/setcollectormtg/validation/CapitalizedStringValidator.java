package com.setcollectormtg.setcollectormtg.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class CapitalizedStringValidator implements ConstraintValidator<CapitalizedString, String> {

    @Override
    public void initialize(CapitalizedString constraintAnnotation) {
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isEmpty()) {
            return true; // @NotBlank validation will handle this case
        }

        // Get the field name from the violation path
        String fieldName = context.getDefaultConstraintMessageTemplate()
            .replaceAll("The field (.*) must start with a capital letter", "$1");

        String errorMessage = ValidationErrorBuilder.buildCapitalizedValidationError(value, fieldName);
        
        if (errorMessage != null) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(errorMessage)
                   .addConstraintViolation();
            return false;
        }
        
        return true;
    }
}