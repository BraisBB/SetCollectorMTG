package com.setcollectormtg.setcollectormtg.repository;

import com.setcollectormtg.setcollectormtg.model.Deck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

@Repository
public interface DeckRepository extends JpaRepository<Deck, Long> {
    boolean existsByDeckNameAndUser_UserId(String deckName, Long userId);

    List<Deck> findByUser_UserId(Long userId);

    Page<Deck> findByUser_UserId(Long userId, Pageable pageable);
}
