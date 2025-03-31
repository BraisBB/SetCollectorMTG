package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.DeckCreateDto;
import com.setcollectormtg.setcollectormtg.dto.DeckDto;
import java.util.List;

public interface DeckService {
    List<DeckDto> getAllDecks();
    DeckDto getDeckById(Long id);
    DeckDto createDeck(DeckCreateDto deckCreateDto);
    DeckDto updateDeck(Long id, DeckDto deckDto);
    void deleteDeck(Long id);
    List<DeckDto> getDecksByUser(Long userId);
    int getCardCountInDeck(Long deckId);
}