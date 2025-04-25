package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.CardCreateDto;
import com.setcollectormtg.setcollectormtg.dto.CardDto;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.mapper.CardMapper;
import com.setcollectormtg.setcollectormtg.model.Card;
import com.setcollectormtg.setcollectormtg.model.SetMtg;
import com.setcollectormtg.setcollectormtg.repository.CardRepository;
import com.setcollectormtg.setcollectormtg.repository.SetMtgRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CardServiceImpl implements CardService {

    private final CardRepository cardRepository;
    private final SetMtgRepository setMtgRepository;
    private final CardMapper cardMapper;

    /**
     * Obtiene todas las cartas registradas en la base de datos.
     *
     * @return Lista de cartas en formato DTO
     */
    @Override
    @Transactional(readOnly = true)
    public List<CardDto> getAllCards() {
        return cardRepository.findAll().stream()
                .map(cardMapper::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene una carta por su ID.
     * Lanza excepción si no existe.
     *
     * @param id ID de la carta
     * @return DTO de la carta encontrada
     */
    @Override
    @Transactional(readOnly = true)
    public CardDto getCardById(Long id) {
        return cardRepository.findById(id)
                .map(cardMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + id));
    }

    /**
     * Crea una nueva carta asociada a un set existente.
     * Lanza excepción si el set no existe.
     *
     * @param cardCreateDto DTO con los datos de la carta a crear
     * @return DTO de la carta creada
     */
    @Override
    @Transactional
    public CardDto createCard(CardCreateDto cardCreateDto) {
        SetMtg setMtg = setMtgRepository.findById(cardCreateDto.getSetId())
                .orElseThrow(() -> new ResourceNotFoundException("Set not found with id: " + cardCreateDto.getSetId()));

        Card card = cardMapper.toEntity(cardCreateDto);
        card.setSetMtg(setMtg);

        Card savedCard = cardRepository.save(card);
        return cardMapper.toDto(savedCard);
    }

    /**
     * Actualiza los datos de una carta, validando que el set asociado exista si se modifica.
     * Lanza excepción si la carta o el set no existen.
     *
     * @param id      ID de la carta a actualizar
     * @param cardDto DTO con los nuevos datos de la carta
     * @return DTO actualizado de la carta
     */
    @Override
    @Transactional
    public CardDto updateCard(Long id, CardDto cardDto) {
        Card existingCard = cardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + id));

        cardMapper.updateCardFromDto(cardDto, existingCard);

        // Actualizar setMtg solo si es diferente
        if (cardDto.getSetId() != null &&
                (existingCard.getSetMtg() == null || !existingCard.getSetMtg().getSetId().equals(cardDto.getSetId()))) {
            SetMtg setMtg = setMtgRepository.findById(cardDto.getSetId())
                    .orElseThrow(() -> new ResourceNotFoundException("Set not found with id: " + cardDto.getSetId()));
            existingCard.setSetMtg(setMtg);
        }

        Card updatedCard = cardRepository.save(existingCard);
        return cardMapper.toDto(updatedCard);
    }

    /**
     * Elimina una carta por su ID.
     * Lanza excepción si la carta no existe.
     *
     * @param id ID de la carta a eliminar
     */
    @Override
    @Transactional
    public void deleteCard(Long id) {
        Card card = cardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + id));
        cardRepository.delete(card);
    }
    
    /**
     * Busca cartas por nombre (parcial, ignorando mayúsculas/minúsculas).
     *
     * @param name Nombre o parte del nombre de la carta
     * @return Lista de cartas que coinciden con el criterio
     */
    @Override
    @Transactional(readOnly = true)
    public List<CardDto> getCardsByName(String name) {
        return cardRepository.findByNameContainingIgnoreCase(name).stream()
                .map(cardMapper::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Busca cartas por tipo (parcial, ignorando mayúsculas/minúsculas).
     *
     * @param cardType Tipo o parte del tipo de la carta
     * @return Lista de cartas que coinciden con el criterio
     */
    @Override
    @Transactional(readOnly = true)
    public List<CardDto> getCardsByType(String cardType) {
        return cardRepository.findByCardTypeContainingIgnoreCase(cardType).stream()
                .map(cardMapper::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Busca cartas por color usando el símbolo de color en el coste de maná.
     *
     * @param colorSymbol Símbolo de color (W, U, B, R, G)
     * @return Lista de cartas que contienen el símbolo de color
     */
    @Override
    @Transactional(readOnly = true)
    public List<CardDto> getCardsByColor(String colorSymbol) {
        return cardRepository.findByColorSymbol(colorSymbol).stream()
                .map(cardMapper::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Busca cartas aplicando múltiples filtros de forma combinada.
     * Los parámetros nulos se ignoran.
     *
     * @param name Nombre o parte del nombre de la carta (opcional)
     * @param cardType Tipo o parte del tipo de la carta (opcional)
     * @param colorSymbol Símbolo de color (opcional)
     * @param manaCostMin Coste mínimo de maná (opcional)
     * @param manaCostMax Coste máximo de maná (opcional)
     * @return Lista de cartas que cumplen todos los criterios proporcionados
     */
    @Override
    @Transactional(readOnly = true)
    public List<CardDto> getCardsByFilters(String name, String cardType, String colorSymbol, Integer manaCostMin, Integer manaCostMax) {
        return cardRepository.findByFilters(name, cardType, colorSymbol, manaCostMin, manaCostMax).stream()
                .map(cardMapper::toDto)
                .collect(Collectors.toList());
    }
}