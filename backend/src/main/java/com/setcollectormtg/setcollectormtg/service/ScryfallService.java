package com.setcollectormtg.setcollectormtg.service;

import org.springframework.stereotype.Service;

@Service
public class ScryfallService {

    private static final String SCRYFALL_IMAGE_API = "https://api.scryfall.com/cards/";

    public String generateImageUrl(String scryfallId) {
        if (scryfallId == null || scryfallId.isEmpty()) {
            return null;
        }
        return SCRYFALL_IMAGE_API + scryfallId + "?format=image";
    }

}