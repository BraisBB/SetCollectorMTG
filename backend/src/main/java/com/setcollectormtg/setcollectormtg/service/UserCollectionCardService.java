package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.UserCollectionCardDto;

public interface UserCollectionCardService {
    UserCollectionCardDto addCardToCollection(Long collectionId, Long cardId, Integer quantity);

    UserCollectionCardDto updateCardQuantity(Long collectionId, Long cardId, Integer newQuantity);

    void removeCardFromCollection(Long collectionId, Long cardId);

    UserCollectionCardDto getCardCollectionInfo(Long collectionId, Long cardId);

    Integer getCardCountInCollection(Long collectionId, Long cardId);
}