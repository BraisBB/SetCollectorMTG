package com.setcollectormtg.setcollectormtg.repository;

import com.setcollectormtg.setcollectormtg.model.UserCollectionCard;
import com.setcollectormtg.setcollectormtg.model.UserCollectionCardId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserCollectionCardRepository extends JpaRepository<UserCollectionCard, UserCollectionCardId> {

    Optional<UserCollectionCard> findByUserCollection_CollectionIdAndCard_CardId(Long collectionId, Long cardId);

    boolean existsByUserCollection_CollectionIdAndCard_CardId(Long collectionId, Long cardId);

    List<UserCollectionCard> findByUserCollection_CollectionId(Long collectionId);

    @Transactional
    @Modifying
    @Query("UPDATE UserCollectionCard ucc SET ucc.nCopies = :nCopies WHERE ucc.id.collectionId = :collectionId AND ucc.id.cardId = :cardId")
    void updateCopies(Long collectionId, Long cardId, Integer nCopies);

    @Transactional
    void deleteByUserCollection_CollectionIdAndCard_CardId(Long collectionId, Long cardId);

    @Query("SELECT SUM(ucc.nCopies) FROM UserCollectionCard ucc WHERE ucc.userCollection.collectionId = :collectionId")
    Optional<Integer> sumCopiesByCollectionId(Long collectionId);
}