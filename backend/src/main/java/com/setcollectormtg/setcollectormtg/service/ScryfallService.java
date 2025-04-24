package com.setcollectormtg.setcollectormtg.service;

import org.springframework.stereotype.Service;

@Service
public class ScryfallService {

    private static final String SCRYFALL_IMAGE_API = "https://api.scryfall.com/cards/";

    /**
     * Genera la URL de la imagen de una carta en Scryfall a partir de su ID.
     * Devuelve null si el ID es nulo o vacío.
     *
     * @param scryfallId ID único de la carta en Scryfall
     * @return URL de la imagen de la carta o null si el ID es inválido
     */
    public String generateImageUrl(String scryfallId) {
        if (scryfallId == null || scryfallId.isEmpty()) {
            return null;
        }
        return SCRYFALL_IMAGE_API + scryfallId + "?format=image";
    }

}