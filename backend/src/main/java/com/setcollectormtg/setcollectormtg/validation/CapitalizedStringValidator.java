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
            return true; // La validación @NotBlank se encargará de este caso
        }

        // Obtenemos el nombre del campo del path de la violación
        String fieldName = context.getDefaultConstraintMessageTemplate()
            .replaceAll("El campo (.*) debe comenzar con mayúscula", "$1");

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