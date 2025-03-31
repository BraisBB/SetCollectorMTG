package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.CardDeckDto;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.mapper.CardDeckMapper;
import com.setcollectormtg.setcollectormtg.model.*;
import com.setcollectormtg.setcollectormtg.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CardDeckServiceImpl implements CardDeckService {

    private final CardDeckRepository cardDeckRepository;
    private final DeckRepository deckRepository;
    private final CardRepository cardRepository;
    private final CardDeckMapper cardDeckMapper;

    @Override
    @Transactional
    public CardDeckDto addCardToDeck(Long deckId, Long cardId, Integer quantity) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + deckId));

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + cardId));

        if (cardDeckRepository.existsByDeck_DeckIdAndCard_CardId(deckId, cardId)) {
            throw new IllegalStateException("Card already exists in deck");
        }

        CardDeck cardDeck = new CardDeck();
        cardDeck.setId(new CardDeckId(deckId, cardId));
        cardDeck.setDeck(deck);
        cardDeck.setCard(card);
        cardDeck.setNCopies(quantity);

        // Actualizar contador total
        updateDeckTotalCards(deck, quantity);

        return cardDeckMapper.toDto(cardDeckRepository.save(cardDeck));
    }

    @Override
    @Transactional
    public CardDeckDto updateCardQuantity(Long deckId, Long cardId, Integer newQuantity) {
        if (newQuantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }

        CardDeck cardDeck = cardDeckRepository.findByDeck_DeckIdAndCard_CardId(deckId, cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found in deck"));

        // Calcular diferencia y actualizar total
        int difference = newQuantity - cardDeck.getNCopies();
        updateDeckTotalCards(cardDeck.getDeck(), difference);

        cardDeck.setNCopies(newQuantity);
        return cardDeckMapper.toDto(cardDeckRepository.save(cardDeck));
    }

    @Override
    @Transactional
    public void removeCardFromDeck(Long deckId, Long cardId) {
        CardDeck cardDeck = cardDeckRepository.findByDeck_DeckIdAndCard_CardId(deckId, cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found in deck"));

        // Actualizar contador total (restar las copias)
        updateDeckTotalCards(cardDeck.getDeck(), -cardDeck.getNCopies());

        cardDeckRepository.delete(cardDeck);
    }

    @Override
    @Transactional(readOnly = true)
    public CardDeckDto getCardDeckInfo(Long deckId, Long cardId) {
        return cardDeckRepository.findByDeck_DeckIdAndCard_CardId(deckId, cardId)
                .map(cardDeckMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found in deck"));
    }

    @Override
    @Transactional(readOnly = true)
    public Integer getCardCountInDeck(Long deckId, Long cardId) {
        return cardDeckRepository.findByDeck_DeckIdAndCard_CardId(deckId, cardId)
                .map(CardDeck::getNCopies)
                .orElse(0);
    }

    private void updateDeckTotalCards(Deck deck, int quantityDifference) {
        deck.setTotalCards(deck.getTotalCards() + quantityDifference);
        deckRepository.save(deck);
    }
}