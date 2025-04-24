package com.setcollectormtg.setcollectormtg.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Excepción personalizada para indicar que un recurso solicitado no fue encontrado.
 * Se utiliza en servicios y controladores para lanzar errores 404 de forma controlada.
 * Al ser lanzada, retorna automáticamente una respuesta HTTP 404 (NOT_FOUND).
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {
    /**
     * Crea una nueva excepción indicando que el recurso no fue encontrado.
     * @param message Mensaje descriptivo del recurso no encontrado
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }
}