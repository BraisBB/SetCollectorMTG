package com.setcollectormtg.setcollectormtg.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = StrongPasswordValidator.class)
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface StrongPassword {
    String message() default "Password must be between 8 and 16 characters, include uppercase, lowercase, numbers and special characters (!@?./#$%)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}