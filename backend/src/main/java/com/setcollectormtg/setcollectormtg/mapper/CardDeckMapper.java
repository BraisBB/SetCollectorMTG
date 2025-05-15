package com.setcollectormtg.setcollectormtg.mapper;

import com.setcollectormtg.setcollectormtg.dto.CardDeckDto;
import com.setcollectormtg.setcollectormtg.model.CardDeck;
import com.setcollectormtg.setcollectormtg.model.CardDeckId;
import org.springframework.stereotype.Component;

@Component
public class CardDeckMapper {

    public CardDeckDto toDto(CardDeck cardDeck) {
        if (cardDeck == null) {
            return null;
        }
        
        CardDeckDto dto = new CardDeckDto();
        
        // Mapear propiedades desde la entidad al DTO
        if (cardDeck.getId() != null) {
            dto.setDeckId(cardDeck.getId().getDeckId());
            dto.setCardId(cardDeck.getId().getCardId());
        }
        
        // Mapear número de copias
        dto.setNCopies(cardDeck.getNCopies());
        
        // Mapear propiedades de la carta
        if (cardDeck.getCard() != null) {
            dto.setCardName(cardDeck.getCard().getName());
            dto.setCardImageUrl(cardDeck.getCard().getImageUrl());
            dto.setCardType(cardDeck.getCard().getCardType());
            dto.setManaCost(cardDeck.getCard().getManaCost());
        }
        
        return dto;
    }

    public CardDeck toEntity(CardDeckDto dto) {
        if (dto == null) {
            return null;
        }
        
        CardDeck cardDeck = new CardDeck();
        
        // Crear y asignar la clave compuesta
        CardDeckId id = new CardDeckId(dto.getDeckId(), dto.getCardId());
        cardDeck.setId(id);
        
        // Mapear número de copias
        cardDeck.setNCopies(dto.getNCopies());
        
        // Nota: deck y card se asignan en el servicio
        
        return cardDeck;
    }
}