package com.setcollectormtg.setcollectormtg.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = CapitalizedStringValidator.class)
@Target({ ElementType.FIELD })
@Retention(RetentionPolicy.RUNTIME)
public @interface CapitalizedString {
    String message() default "The text must start with a capital letter";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}