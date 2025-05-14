package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.CardDeckDto;
import java.util.List;

public interface CardDeckService {
    CardDeckDto addCardToDeck(Long deckId, Long cardId, Integer quantity);

    CardDeckDto updateCardQuantity(Long deckId, Long cardId, Integer newQuantity);

    void removeCardFromDeck(Long deckId, Long cardId);

    CardDeckDto getCardDeckInfo(Long deckId, Long cardId);

    Integer getCardCountInDeck(Long deckId, Long cardId);
    
    /**
     * Obtiene todas las cartas de un mazo específico
     * @param deckId ID del mazo
     * @return Lista de CardDeckDto con información de las cartas y sus cantidades
     */
    List<CardDeckDto> getAllCardsInDeck(Long deckId);
}