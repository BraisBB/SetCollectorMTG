package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.DeckCreateDto;
import com.setcollectormtg.setcollectormtg.dto.DeckDto;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.mapper.DeckMapper;
import com.setcollectormtg.setcollectormtg.model.Deck;
import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.repository.DeckRepository;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import com.setcollectormtg.setcollectormtg.util.CurrentUserUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeckServiceImpl implements DeckService {

    private final DeckRepository deckRepository;
    private final UserRepository userRepository;
    private final DeckMapper deckMapper;
    private final CurrentUserUtil currentUserUtil;

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
        log.debug("Iniciando proceso de creación de mazo: {}", deckCreateDto);
        
        // Obtener el usuario autenticado
        User currentUser = currentUserUtil.getCurrentUser();
        if (currentUser == null) {
            throw new IllegalStateException("User authentication required");
        }
        
        log.debug("Usuario autenticado: ID={}, username={}", currentUser.getUserId(), currentUser.getUsername());

        // Verificar si ya existe un deck con el mismo nombre para este usuario
        if (deckRepository.existsByDeckNameAndUser_UserId(deckCreateDto.getDeckName(), currentUser.getUserId())) {
            log.warn("Ya existe un mazo con nombre '{}' para el usuario {}", 
                    deckCreateDto.getDeckName(), currentUser.getUsername());
            throw new IllegalArgumentException(
                    "Deck with name '" + deckCreateDto.getDeckName() + "' already exists for this user");
        }

        // Crear entidad Deck
        Deck deck = deckMapper.toEntity(deckCreateDto, currentUser);
        deck.setTotalCards(0); // Inicializar contador de cartas
        
        Deck savedDeck = deckRepository.save(deck);
        log.info("Mazo creado exitosamente con ID: {}", savedDeck.getDeckId());
        
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

        Deck updatedDeck = deckRepository.save(existingDeck);
        return deckMapper.toDto(updatedDeck);
    }

    @Override
    @Transactional
    public void deleteDeck(Long id) {
        Deck deck = deckRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + id));

        log.info("Eliminando mazo con ID: {} y todas sus cartas asociadas", id);
        deckRepository.delete(deck);
        log.info("Mazo con ID: {} eliminado exitosamente", id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckDto> getDecksByUser(Long userId) {
        log.info("Buscando mazos para usuario ID: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        List<Deck> decks = deckRepository.findByUser_UserId(userId);
        log.info("Se encontraron {} mazos para el usuario {}", decks.size(), user.getUsername());
        
        return decks.stream()
                .map(deckMapper::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public int getCardCountInDeck(Long deckId) {
        return deckRepository.findById(deckId)
                .map(Deck::getTotalCards)
                .orElse(0);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DeckDto> getDecksByUserPaged(Long userId, Pageable pageable) {
        return deckRepository.findByUser_UserId(userId, pageable)
                .map(deckMapper::toDto);
    }

    @Override
    @Transactional
    public DeckDto updateDeckColor(Long deckId) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + deckId));

        // Lógica para recalcular el color del deck basado en las cartas
        // Por ahora simplemente guardamos el deck sin cambios
        Deck updatedDeck = deckRepository.save(deck);
        return deckMapper.toDto(updatedDeck);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckDto> getDecksByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        
        return getDecksByUser(user.getUserId());
    }
} 