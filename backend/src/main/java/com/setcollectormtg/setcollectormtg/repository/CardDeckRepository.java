package com.setcollectormtg.setcollectormtg.repository;

import com.setcollectormtg.setcollectormtg.model.CardDeck;
import com.setcollectormtg.setcollectormtg.model.CardDeckId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CardDeckRepository extends JpaRepository<CardDeck, CardDeckId> {
    boolean existsByDeck_DeckId(Long deckId);
    int countByDeck_DeckId(Long deckId);
    void deleteByDeck_DeckId(Long deckId);
}