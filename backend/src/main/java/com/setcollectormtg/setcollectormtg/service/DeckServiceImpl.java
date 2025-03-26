package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.model.Deck;
import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.repository.DeckRepository;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DeckServiceImpl implements DeckService {

    private final DeckRepository deckRepository;
    private final UserRepository userRepository; // Necesario para relaciones

    @Override
    public List<Deck> getAllDecks() {
        return deckRepository.findAll();
    }

    @Override
    public Deck getDeckById(Long id) {
        return deckRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deck not found with id: " + id));
    }

    @Override
    public Deck createDeck(Deck deck) {
        // Verificar que el usuario existe
        User user = userRepository.findById(deck.getUser().getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        deck.setUser(user);
        return deckRepository.save(deck);
    }

    @Override
    public Deck updateDeck(Long id, Deck deckDetails) {
        Deck deck = getDeckById(id);

        deck.setDeckName(deckDetails.getDeckName());
        deck.setGameType(deckDetails.getGameType());
        deck.setDeckColor(deckDetails.getDeckColor());

        // Actualizar usuario si es necesario
        if (deckDetails.getUser() != null &&
                !deck.getUser().getUserId().equals(deckDetails.getUser().getUserId())) {
            User user = userRepository.findById(deckDetails.getUser().getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            deck.setUser(user);
        }

        return deckRepository.save(deck);
    }

    @Override
    public void deleteDeck(Long id) {
        Deck deck = getDeckById(id);
        deckRepository.delete(deck);
    }

    @Override
    public List<Deck> getDecksByUser(Long id) {
        return deckRepository.findByUserId(id);
    }
}