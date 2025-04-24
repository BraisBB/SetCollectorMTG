package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.UserCollectionDto;

public interface UserCollectionService {
    UserCollectionDto createCollection(UserCollectionDto collectionDto);

    UserCollectionDto getCollectionById(Long id);

    UserCollectionDto getCollectionByUserId(Long userId);

    UserCollectionDto updateCollection(Long id, UserCollectionDto collectionDto);

    void deleteCollection(Long id);

    Integer getTotalCardsInCollection(Long collectionId);
}