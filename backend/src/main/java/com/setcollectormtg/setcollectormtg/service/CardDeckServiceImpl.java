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
    private final DeckService deckService;

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
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + deckId));

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + cardId));

        GameType gameType = deck.getGameType();
        
        // Verificar si ya existe la carta en el mazo
        if (cardDeckRepository.existsByDeck_DeckIdAndCard_CardId(deckId, cardId)) {
            throw new IllegalStateException("Card already exists in deck");
        }

        // Verificar límite de copias según el formato
        validateCardCopies(deckId, cardId, quantity, gameType);

        // Verificar límite total de cartas según el formato
        validateTotalCards(deck, quantity, gameType);

        CardDeck cardDeck = new CardDeck();
        cardDeck.setId(new CardDeckId(deckId, cardId));
        cardDeck.setDeck(deck);
        cardDeck.setCard(card);
        cardDeck.setNCopies(quantity);

        updateDeckTotalCards(deck, quantity);

        CardDeckDto result = cardDeckMapper.toDto(cardDeckRepository.save(cardDeck));
        
        // Actualizar el color del mazo basado en las cartas que contiene
        deckService.updateDeckColor(deckId);
        
        return result;
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
        if (newQuantity <= 0) {
            removeCardFromDeck(deckId, cardId);
            // Crear un DTO para mantener la interfaz, aunque la carta ya se eliminó
            CardDeckDto dto = new CardDeckDto();
            dto.setDeckId(deckId);
            dto.setCardId(cardId);
            dto.setNCopies(0);
            return dto;
        }

        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + deckId));

        CardDeck cardDeck = cardDeckRepository.findByDeck_DeckIdAndCard_CardId(deckId, cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found in deck"));

        GameType gameType = deck.getGameType();
        
        // Verificar límite de copias según el formato
        if (newQuantity > gameType.getMaxCopies()) {
            throw new IllegalStateException(
                String.format("Format %s only allows %d copies of the same card", 
                    gameType.getName(), gameType.getMaxCopies())
            );
        }

        // Calcular la diferencia para actualizar el total de cartas del mazo
        int quantityDifference = newQuantity - cardDeck.getNCopies();
        
        // Verificar límite total de cartas según el formato
        validateTotalCards(deck, quantityDifference, gameType);

        // Actualizar cantidad de copias y total de cartas del mazo
        cardDeck.setNCopies(newQuantity);
        updateDeckTotalCards(deck, quantityDifference);

        CardDeckDto result = cardDeckMapper.toDto(cardDeckRepository.save(cardDeck));
        
        // Actualizar el color del mazo basado en las cartas que contiene
        deckService.updateDeckColor(deckId);
        
        return result;
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
        CardDeck cardDeck = cardDeckRepository.findByDeck_DeckIdAndCard_CardId(deckId, cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found in deck"));

        Deck deck = cardDeck.getDeck();
        
        // Actualizar total de cartas en el mazo
        int quantityToRemove = -cardDeck.getNCopies(); // Negativo porque estamos reduciendo
        updateDeckTotalCards(deck, quantityToRemove);

        // Eliminar la carta del mazo
        cardDeckRepository.delete(cardDeck);
        
        // Actualizar el color del mazo basado en las cartas que contiene
        deckService.updateDeckColor(deckId);
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

    /**
     * Obtiene todas las cartas asociadas a un mazo específico
     * 
     * @param deckId ID del mazo
     * @return Lista de CardDeckDto con información de las cartas y sus cantidades
     */
    @Override
    @Transactional(readOnly = true)
    public List<CardDeckDto> getAllCardsInDeck(Long deckId) {
        // Verificar primero que el mazo existe
        deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + deckId));
        
        // Obtener todas las relaciones de cartas en el mazo usando el método optimizado
        List<CardDeck> cardDecks = cardDeckRepository.findByDeck_DeckId(deckId);
        
        // Convertir a DTOs
        return cardDecks.stream()
                .map(cardDeckMapper::toDto)
                .collect(Collectors.toList());
    }

    private void updateDeckTotalCards(Deck deck, int quantityDifference) {
        deck.setTotalCards(deck.getTotalCards() + quantityDifference);
        deckRepository.save(deck);
    }

    /**
     * Valida que la cantidad de copias de una carta no exceda el máximo permitido por el formato.
     * Lanza excepción si se excede el límite.
     *
     * @param deckId   ID del mazo
     * @param cardId   ID de la carta
     * @param quantity Cantidad de copias
     * @param gameType Formato del juego
     */
    private void validateCardCopies(Long deckId, Long cardId, Integer quantity, GameType gameType) {
        if (quantity > gameType.getMaxCopies()) {
            throw new IllegalStateException(
                String.format("Format %s only allows %d copies of the same card", 
                    gameType.getName(), gameType.getMaxCopies())
            );
        }
    }

    /**
     * Valida que el total de cartas en el mazo no exceda el máximo permitido por el formato.
     * Lanza excepción si se excede el límite.
     *
     * @param deck           Mazo
     * @param quantityToAdd  Cantidad a agregar
     * @param gameType       Formato del juego
     */
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