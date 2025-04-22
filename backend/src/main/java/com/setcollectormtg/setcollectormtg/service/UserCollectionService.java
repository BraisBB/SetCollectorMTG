package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.model.UserCollection;

public interface UserCollectionService {
    UserCollection createCollection(UserCollection collection);

    UserCollection getCollectionById(Long id);

    UserCollection getCollectionByUserId(Long userId);

    UserCollection updateCollection(Long id, UserCollection collection);

    void deleteCollection(Long id);

    Integer getTotalCardsInCollection(Long collectionId);
}