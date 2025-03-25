package com.setcollectormtg.setcollectormtg.repository;

import com.setcollectormtg.setcollectormtg.model.Deck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeckRepository extends JpaRepository<Deck, Long> {
}
