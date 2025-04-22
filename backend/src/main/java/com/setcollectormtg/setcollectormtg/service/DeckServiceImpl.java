package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.DeckCreateDto;
import com.setcollectormtg.setcollectormtg.dto.DeckDto;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.mapper.DeckMapper;
import com.setcollectormtg.setcollectormtg.model.Deck;
import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.repository.CardDeckRepository;
import com.setcollectormtg.setcollectormtg.repository.DeckRepository;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DeckServiceImpl implements DeckService {

    private final DeckRepository deckRepository;
    private final UserRepository userRepository;
    private final CardDeckRepository cardDeckRepository;
    private final DeckMapper deckMapper;

    @Override
    @Transactional(readOnly = true)
    public List<DeckDto> getAllDecks() {
        return deckRepository.findAll().stream()
                .map(deckMapper::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DeckDto getDeckById(Long id) {
        return deckRepository.findById(id)
                .map(deckMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + id));
    }

    @Override
    @Transactional
    public DeckDto createDeck(DeckCreateDto deckCreateDto) {
        // Obtener el usuario autenticado
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = jwt.getSubject();

        // Buscar el usuario por su keycloakId
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        // Verificar si ya existe un deck con el mismo nombre para este usuario
        if (deckRepository.existsByDeckNameAndUser_UserId(deckCreateDto.getDeckName(), user.getUserId())) {
            throw new IllegalArgumentException(
                    "Deck with name '" + deckCreateDto.getDeckName() + "' already exists for this user");
        }

        Deck deck = deckMapper.toEntity(deckCreateDto, user);
        deck.setTotalCards(0); // Inicializar contador de cartas
        Deck savedDeck = deckRepository.save(deck);
        return deckMapper.toDto(savedDeck);
    }

    @Override
    @Transactional
    public DeckDto updateDeck(Long id, DeckDto deckDto) {
        Deck existingDeck = deckRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + id));

        // Verificar si el nuevo nombre ya existe para otro deck del mismo usuario
        if (!existingDeck.getDeckName().equals(deckDto.getDeckName()) &&
                deckRepository.existsByDeckNameAndUser_UserId(deckDto.getDeckName(), deckDto.getUserId())) {
            throw new IllegalArgumentException(
                    "Deck with name '" + deckDto.getDeckName() + "' already exists for this user");
        }

        // Actualizar campos básicos
        existingDeck.setDeckName(deckDto.getDeckName());
        existingDeck.setGameType(deckDto.getGameType());
        existingDeck.setDeckColor(deckDto.getDeckColor());
        existingDeck.setTotalCards(deckDto.getTotalCards());

        // Actualizar usuario solo si es diferente
        if (!existingDeck.getUser().getUserId().equals(deckDto.getUserId())) {
            User user = userRepository.findById(deckDto.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + deckDto.getUserId()));
            existingDeck.setUser(user);
        }

        Deck updatedDeck = deckRepository.save(existingDeck);
        return deckMapper.toDto(updatedDeck);
    }

    @Override
    @Transactional
    public void deleteDeck(Long id) {
        Deck deck = deckRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + id));

        // Verificar si hay cartas asociadas usando CardDeckRepository
        if (cardDeckRepository.existsByDeck_DeckId(id)) {
            throw new IllegalStateException("Cannot delete deck with id " + id +
                    " because it contains cards. Remove cards first.");
        }

        deckRepository.delete(deck);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckDto> getDecksByUser(Long userId) {
        return deckRepository.findByUser_UserId(userId).stream()
                .map(deckMapper::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public int getCardCountInDeck(Long deckId) {
        return cardDeckRepository.countByDeck_DeckId(deckId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DeckDto> getDecksByUserPaged(Long userId, Pageable pageable) {
        return deckRepository.findByUser_UserId(userId, pageable).map(deckMapper::toDto);
    }
}