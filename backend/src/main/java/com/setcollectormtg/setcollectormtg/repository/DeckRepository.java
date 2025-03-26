package com.setcollectormtg.setcollectormtg.repository;

import com.setcollectormtg.setcollectormtg.model.Deck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeckRepository extends JpaRepository<Deck, Long> {
    @Query("SELECT d FROM Deck d WHERE d.user.userId = :userId")
    List<Deck> findByUserId(@Param("userId") Long userId);
}
