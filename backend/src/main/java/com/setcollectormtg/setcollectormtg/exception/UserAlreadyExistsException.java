package com.setcollectormtg.setcollectormtg.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Excepción personalizada para indicar que un usuario ya existe en el sistema.
 * Se utiliza durante el proceso de registro cuando se intenta crear un usuario 
 * con un username o email que ya está en uso.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class UserAlreadyExistsException extends RuntimeException {
    
    /**
     * Crea una nueva excepción indicando que el usuario ya existe.
     * @param message Mensaje descriptivo del conflicto de usuario
     */
    public UserAlreadyExistsException(String message) {
        super(message);
    }
    
    /**
     * Crea una nueva excepción con mensaje y causa.
     * @param message Mensaje descriptivo del conflicto
     * @param cause Causa original de la excepción
     */
    public UserAlreadyExistsException(String message, Throwable cause) {
        super(message, cause);
    }
} 