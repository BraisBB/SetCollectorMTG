package com.setcollectormtg.setcollectormtg.handler;

import com.setcollectormtg.setcollectormtg.dto.ErrorResponse;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.exception.UserAlreadyExistsException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import jakarta.validation.ConstraintViolationException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

        /**
         * Maneja excepciones de tipo ResourceNotFoundException y retorna una respuesta
         * 404 con detalles del error.
         *
         * @param ex      Excepción lanzada cuando un recurso no es encontrado
         * @param request Información de la petición web
         * @return ResponseEntity con el error y estado 404
         */
        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
                        ResourceNotFoundException ex,
                        WebRequest request) {

                log.error("Resource not found: {}", ex.getMessage(), ex);

                ErrorResponse error = ErrorResponse.builder()
                                .code("NOT_FOUND")
                                .message(ex.getMessage())
                                .timestamp(LocalDateTime.now())
                                .path(request.getDescription(false).replace("uri=", ""))
                                .status(HttpStatus.NOT_FOUND.value())
                                .build();

                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        /**
         * Maneja excepciones de validación de argumentos en controladores
         * (anotaciones @Valid).
         * Retorna una respuesta 400 con los errores de validación por campo.
         *
         * @param ex      Excepción de validación de argumentos
         * @param request Información de la petición web
         * @return ResponseEntity con los errores de validación y estado 400
         */
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponse> handleValidationExceptions(
                        MethodArgumentNotValidException ex,
                        WebRequest request) {

                log.error("Validation error: {}", ex.getMessage(), ex);

                Map<String, String> errors = new HashMap<>();
                ex.getBindingResult().getFieldErrors()
                                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

                ErrorResponse error = ErrorResponse.builder()
                                .code("VALIDATION_ERROR")
                                .message("Validation error")
                                .errors(errors)
                                .timestamp(LocalDateTime.now())
                                .path(request.getDescription(false).replace("uri=", ""))
                                .status(HttpStatus.BAD_REQUEST.value())
                                .build();

                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        @ExceptionHandler(ConstraintViolationException.class)
        public ResponseEntity<ErrorResponse> handleConstraintViolationException(
                        ConstraintViolationException ex,
                        WebRequest request) {

                log.error("Constraint validation error: {}", ex.getMessage(), ex);

                Map<String, String> errors = new HashMap<>();
                ex.getConstraintViolations().forEach(violation -> {
                        String fieldName = violation.getPropertyPath().toString();
                        String message = violation.getMessage();
                        errors.put(fieldName, message);
                });

                ErrorResponse error = ErrorResponse.builder()
                                .code("CONSTRAINT_VIOLATION")
                                .message("Constraint validation error")
                                .errors(errors)
                                .timestamp(LocalDateTime.now())
                                .path(request.getDescription(false).replace("uri=", ""))
                                .status(HttpStatus.BAD_REQUEST.value())
                                .build();

                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ErrorResponse> handleAccessDeniedException(
                        AccessDeniedException ex,
                        WebRequest request) {

                log.error("Access denied: {}", ex.getMessage(), ex);

                ErrorResponse error = ErrorResponse.builder()
                                .code("ACCESS_DENIED")
                                .message("You don't have permission to perform this action")
                                .timestamp(LocalDateTime.now())
                                .path(request.getDescription(false).replace("uri=", ""))
                                .status(HttpStatus.FORBIDDEN.value())
                                .build();

                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        /**
         * Maneja excepciones cuando un usuario ya existe
         */
        @ExceptionHandler(UserAlreadyExistsException.class)
        public ResponseEntity<ErrorResponse> handleUserAlreadyExistsException(
                        UserAlreadyExistsException ex,
                        WebRequest request) {

                log.error("User already exists: {}", ex.getMessage(), ex);

                ErrorResponse error = ErrorResponse.builder()
                                .code("USER_ALREADY_EXISTS")
                                .message(ex.getMessage())
                                .timestamp(LocalDateTime.now())
                                .path(request.getDescription(false).replace("uri=", ""))
                                .status(HttpStatus.CONFLICT.value())
                                .build();

                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }

        /**
         * Maneja excepciones de autenticación
         */
        @ExceptionHandler(AuthenticationException.class)
        public ResponseEntity<ErrorResponse> handleAuthenticationException(
                        AuthenticationException ex,
                        WebRequest request) {

                log.error("Authentication error: {}", ex.getMessage(), ex);

                ErrorResponse error = ErrorResponse.builder()
                                .code("AUTHENTICATION_ERROR")
                                .message("Authentication failed")
                                .details(ex.getMessage())
                                .timestamp(LocalDateTime.now())
                                .path(request.getDescription(false).replace("uri=", ""))
                                .status(HttpStatus.UNAUTHORIZED.value())
                                .build();

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        @ExceptionHandler(DataIntegrityViolationException.class)
        public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
                        DataIntegrityViolationException ex,
                        WebRequest request) {

                log.error("Data integrity error: {}", ex.getMessage(), ex);

                String message = "Data integrity error";
                String details = ex.getMostSpecificCause().getMessage();

                if (details.contains("unique constraint") || details.contains("Duplicate entry")) {
                        message = "A record with this data already exists";
                }

                ErrorResponse error = ErrorResponse.builder()
                                .code("DATA_INTEGRITY_ERROR")
                                .message(message)
                                .details(details)
                                .timestamp(LocalDateTime.now())
                                .path(request.getDescription(false).replace("uri=", ""))
                                .status(HttpStatus.BAD_REQUEST.value())
                                .build();

                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        @ExceptionHandler(MethodArgumentTypeMismatchException.class)
        public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatch(
                        MethodArgumentTypeMismatchException ex,
                        WebRequest request) {

                log.error("Argument type error: {}", ex.getMessage(), ex);

                String message = String.format("Parameter '%s' with value '%s' could not be converted to type %s",
                                ex.getName(), ex.getValue(), ex.getRequiredType().getSimpleName());

                ErrorResponse error = ErrorResponse.builder()
                                .code("TYPE_MISMATCH")
                                .message(message)
                                .timestamp(LocalDateTime.now())
                                .path(request.getDescription(false).replace("uri=", ""))
                                .status(HttpStatus.BAD_REQUEST.value())
                                .build();

                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
                        IllegalArgumentException ex,
                        WebRequest request) {

                log.error("Illegal argument: {}", ex.getMessage(), ex);

                ErrorResponse error = ErrorResponse.builder()
                                .code("ILLEGAL_ARGUMENT")
                                .message(ex.getMessage())
                                .timestamp(LocalDateTime.now())
                                .path(request.getDescription(false).replace("uri=", ""))
                                .status(HttpStatus.BAD_REQUEST.value())
                                .build();

                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        /**
         * Maneja excepciones de estado ilegal (reglas de negocio)
         */
        @ExceptionHandler(IllegalStateException.class)
        public ResponseEntity<ErrorResponse> handleIllegalStateException(
                        IllegalStateException ex,
                        WebRequest request) {

                log.error("Illegal state: {}", ex.getMessage(), ex);

                ErrorResponse error = ErrorResponse.builder()
                                .code("ILLEGAL_STATE")
                                .message(ex.getMessage())
                                .timestamp(LocalDateTime.now())
                                .path(request.getDescription(false).replace("uri=", ""))
                                .status(HttpStatus.BAD_REQUEST.value())
                                .build();

                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ErrorResponse> handleGenericException(
                        Exception ex,
                        WebRequest request) {

                log.error("Unexpected error: {}", ex.getMessage(), ex);

                ErrorResponse error = ErrorResponse.builder()
                                .code("INTERNAL_ERROR")
                                .message("An internal error has occurred")
                                .details(ex.getMessage())
                                .timestamp(LocalDateTime.now())
                                .path(request.getDescription(false).replace("uri=", ""))
                                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                                .build();

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
}