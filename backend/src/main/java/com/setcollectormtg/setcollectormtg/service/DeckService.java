package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.model.Deck;
import java.util.List;

public interface DeckService {
    List<Deck> getAllDecks();
    Deck getDeckById(Long id);
    Deck createDeck(Deck deck);
    Deck updateDeck(Long id, Deck deck);
    void deleteDeck(Long id);
    List<Deck> getDecksByUser(Long userId); // Metodo adicional
}