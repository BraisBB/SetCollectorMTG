package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.CardDeckDto;
import com.setcollectormtg.setcollectormtg.enums.GameType;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.mapper.CardDeckMapper;
import com.setcollectormtg.setcollectormtg.model.*;
import com.setcollectormtg.setcollectormtg.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CardDeckServiceImpl implements CardDeckService {

    private final CardDeckRepository cardDeckRepository;
    private final DeckRepository deckRepository;
    private final CardRepository cardRepository;
    private final CardDeckMapper cardDeckMapper;

    /**
     * Agrega una carta a un mazo, validando reglas de formato (límite de copias y total de cartas).
     * Lanza excepción si la carta ya existe en el mazo o si se exceden los límites del formato.
     *
     * @param deckId   ID del mazo
     * @param cardId   ID de la carta
     * @param quantity Número de copias a agregar
     * @return DTO de la carta agregada al mazo
     */
    @Override
    @Transactional
    public CardDeckDto addCardToDeck(Long deckId, Long cardId, Integer quantity) {
        // Validar cantidad
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }
        
        // Verificar si el mazo existe
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + deckId));

        // Verificar si la carta existe
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + cardId));
                
        // Verificar si la carta ya existe en el mazo
        CardDeckId id = new CardDeckId(deckId, cardId);
        if (cardDeckRepository.existsById(id)) {
            throw new IllegalStateException("Card already exists in deck");
        }

        // Validar reglas de formato
        GameType gameType = deck.getGameType();
        validateCopiesLimit(card, quantity, gameType);
        validateTotalCards(deck, quantity, gameType);

        // Crear la relación
        CardDeck cardDeck = new CardDeck();
        cardDeck.setId(id);
        cardDeck.setDeck(deck);
        cardDeck.setCard(card);
        cardDeck.setNCopies(quantity);

        // Guardar la relación
        CardDeck savedCardDeck = cardDeckRepository.save(cardDeck);
        
        // Calcular el total actual de cartas en el mazo
        Integer totalCardsInDeck = cardDeckRepository.sumCopiesByDeckId(deckId).orElse(0);
        
        // Actualizar contador de cartas en el mazo usando el valor calculado
        deck.setTotalCards(totalCardsInDeck);
        deckRepository.save(deck);

        return cardDeckMapper.toDto(savedCardDeck);
    }

    /**
     * Actualiza la cantidad de copias de una carta en un mazo, validando reglas de formato.
     * Lanza excepción si la cantidad es inválida o si se exceden los límites del formato.
     *
     * @param deckId     ID del mazo
     * @param cardId     ID de la carta
     * @param newQuantity Nueva cantidad de copias
     * @return DTO actualizado de la carta en el mazo
     */
    @Override
    @Transactional
    public CardDeckDto updateCardQuantity(Long deckId, Long cardId, Integer newQuantity) {
        // Validar cantidad
        if (newQuantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }
        
        // Buscar la relación existente
        CardDeckId id = new CardDeckId(deckId, cardId);
        CardDeck cardDeck = cardDeckRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found in this deck"));
                
        // Validar reglas de formato si aumenta la cantidad
        int difference = newQuantity - cardDeck.getNCopies();
        if (difference > 0) {
            GameType gameType = cardDeck.getDeck().getGameType();
            validateCopiesLimit(cardDeck.getCard(), newQuantity, gameType);
            validateTotalCards(cardDeck.getDeck(), difference, gameType);
        }
        
        // Guardar la cantidad anterior para poder calcular la diferencia
        int oldQuantity = cardDeck.getNCopies();
        
        // Actualizar cantidad
        cardDeck.setNCopies(newQuantity);
        CardDeck updatedCardDeck = cardDeckRepository.save(cardDeck);
        
        // Actualizar contador de cartas en el mazo
        Deck deck = cardDeck.getDeck();
        
        // Calcular el total actual de cartas en el mazo
        Integer totalCardsInDeck = cardDeckRepository.sumCopiesByDeckId(deckId).orElse(0);
        
        // Actualizar contador de cartas en el mazo usando el valor calculado
        deck.setTotalCards(totalCardsInDeck);
        deckRepository.save(deck);

        return cardDeckMapper.toDto(updatedCardDeck);
    }

    /**
     * Elimina una carta de un mazo, actualizando el contador total de cartas del mazo.
     * Lanza excepción si la carta no existe en el mazo.
     *
     * @param deckId ID del mazo
     * @param cardId ID de la carta
     */
    @Override
    @Transactional
    public void removeCardFromDeck(Long deckId, Long cardId) {
        // Buscar la relación existente
        CardDeckId id = new CardDeckId(deckId, cardId);
        CardDeck cardDeck = cardDeckRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found in this deck"));
        
        // Guardar la cantidad antes de eliminar
        int removedQuantity = cardDeck.getNCopies();
        
        // Eliminar la relación
        cardDeckRepository.deleteById(id);
        
        // Actualizar contador de cartas en el mazo
        Deck deck = deckRepository.findById(deckId).orElse(null);
        if (deck != null) {
            deck.setTotalCards(Math.max(0, deck.getTotalCards() - removedQuantity));
            deckRepository.save(deck);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public CardDeckDto getCardDeckInfo(Long deckId, Long cardId) {
        CardDeckId id = new CardDeckId(deckId, cardId);
        CardDeck cardDeck = cardDeckRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found in this deck"));
        return cardDeckMapper.toDto(cardDeck);
    }

    @Override
    @Transactional(readOnly = true)
    public Integer getCardCountInDeck(Long deckId, Long cardId) {
        CardDeckId id = new CardDeckId(deckId, cardId);
        return cardDeckRepository.findById(id)
                .map(CardDeck::getNCopies)
                .orElse(0);
    }

    /**
     * Obtiene todas las cartas asociadas a un mazo específico
     * 
     * @param deckId ID del mazo
     * @return Lista de CardDeckDto con información de las cartas y sus cantidades
     */
    @Override
    @Transactional(readOnly = true)
    public List<CardDeckDto> getAllCardsInDeck(Long deckId) {
        // Verificar que el mazo existe
        if (!deckRepository.existsById(deckId)) {
            throw new ResourceNotFoundException("Deck not found with id: " + deckId);
        }
        
        // Buscar todas las cartas de ese mazo
        List<CardDeck> cardsInDeck = cardDeckRepository.findByDeck_DeckId(deckId);
        
        // Convertir a DTOs y asegurarse de que nCopies esté correctamente asignado
        return cardsInDeck.stream()
                .map(cardDeckMapper::toDto)
                .collect(Collectors.toList());
    }
    
    private void validateCopiesLimit(Card card, int quantityToAdd, GameType gameType) {
        // Validar límite de copias según el formato
        // En Commander solo puede haber 1 copia de cada carta
        // En Standard pueden haber hasta 4 copias de cada carta excepto tierras básicas
        if (gameType == GameType.COMMANDER && quantityToAdd > 1) {
            throw new IllegalStateException(
                String.format("Format %s only allows 1 copy of each card", gameType.getName())
            );
        } else if (gameType == GameType.STANDARD && quantityToAdd > 4 && !card.getCardType().contains("Basic Land")) {
            throw new IllegalStateException(
                String.format("Format %s only allows 4 copies of each card", gameType.getName())
            );
        }
    }
    
    private void validateTotalCards(Deck deck, int quantityToAdd, GameType gameType) {
        int newTotal = deck.getTotalCards() + quantityToAdd;
        if (newTotal > gameType.getRequiredCards()) {
            throw new IllegalStateException(
                String.format("Format %s only allows %d total cards in deck", 
                    gameType.getName(), gameType.getRequiredCards())
            );
        }
    }
}