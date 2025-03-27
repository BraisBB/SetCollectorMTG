package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.DeckCreateDto;
import com.setcollectormtg.setcollectormtg.dto.DeckDto;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.mapper.DeckMapper;
import com.setcollectormtg.setcollectormtg.model.Deck;
import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.repository.DeckRepository;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeckServiceImpl implements DeckService {

    private final DeckRepository deckRepository;
    private final UserRepository userRepository;
    private final DeckMapper deckMapper;

    @Override
    @Transactional(readOnly = true)
    public List<DeckDto> getAllDecks() {
        return deckRepository.findAll().stream()
                .map(deckMapper::toDto)
                .collect(Collectors.toList());
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
        User user = userRepository.findById(deckCreateDto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + deckCreateDto.getUserId()));

        Deck deck = deckMapper.toEntity(deckCreateDto, user);
        Deck savedDeck = deckRepository.save(deck);
        return deckMapper.toDto(savedDeck);
    }

    @Override
    @Transactional
    public DeckDto updateDeck(Long id, DeckDto deckDto) {
        Deck existingDeck = deckRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + id));

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
        deckRepository.delete(deck);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckDto> getDecksByUser(Long userId) {
        return deckRepository.findByUserId(userId).stream()
                .map(deckMapper::toDto)
                .collect(Collectors.toList());
    }
}