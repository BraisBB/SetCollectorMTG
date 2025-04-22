package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.CardDeckDto;

public interface CardDeckService {
    CardDeckDto addCardToDeck(Long deckId, Long cardId, Integer quantity);

    CardDeckDto updateCardQuantity(Long deckId, Long cardId, Integer newQuantity);

    void removeCardFromDeck(Long deckId, Long cardId);

    CardDeckDto getCardDeckInfo(Long deckId, Long cardId);

    Integer getCardCountInDeck(Long deckId, Long cardId);
}