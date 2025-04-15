package com.setcollectormtg.setcollectormtg.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = CapitalizedStringValidator.class)
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface CapitalizedString {
    String message() default "El texto debe comenzar con mayúscula";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}