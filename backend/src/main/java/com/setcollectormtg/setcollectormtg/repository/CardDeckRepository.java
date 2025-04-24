package com.setcollectormtg.setcollectormtg.repository;

import com.setcollectormtg.setcollectormtg.model.CardDeck;
import com.setcollectormtg.setcollectormtg.model.CardDeckId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface CardDeckRepository extends JpaRepository<CardDeck, CardDeckId> {


    boolean existsByDeck_DeckId(Long deckId);
    int countByDeck_DeckId(Long deckId);
    void deleteByDeck_DeckId(Long deckId);

    // Métodos necesarios para las operaciones CRUD
    Optional<CardDeck> findByDeck_DeckIdAndCard_CardId(Long deckId, Long cardId);

    boolean existsByDeck_DeckIdAndCard_CardId(Long deckId, Long cardId);

    @Transactional
    @Modifying
    @Query("UPDATE CardDeck cd SET cd.nCopies = :nCopies WHERE cd.id.deckId = :deckId AND cd.id.cardId = :cardId")
    void updateCopies(Long deckId, Long cardId, Integer nCopies);

    @Transactional
    void deleteByDeck_DeckIdAndCard_CardId(Long deckId, Long cardId);

    // Método para estadísticas
    @Query("SELECT SUM(cd.nCopies) FROM CardDeck cd WHERE cd.deck.deckId = :deckId")
    Optional<Integer> sumCopiesByDeckId(Long deckId);
}