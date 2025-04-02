package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.UserCollectionDto;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.mapper.UserCollectionMapper;
import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.model.UserCollection;
import com.setcollectormtg.setcollectormtg.repository.UserCollectionRepository;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserCollectionServiceImpl implements UserCollectionService {

    private final UserCollectionRepository userCollectionRepository;
    private final UserRepository userRepository;
    private final UserCollectionMapper userCollectionMapper;

    @Override
    @Transactional
    public UserCollection createCollection(UserCollection collection) {
        // Verificamos si ya existe una colección para este usuario
        if (userCollectionRepository.existsByUser_UserId(collection.getUser().getUserId())) {
            throw new IllegalStateException("User already has a collection");
        }

        // Configuración básica de la colección
        if (collection.getNCopies() == null) {
            collection.setNCopies(0);
        }

        return userCollectionRepository.save(collection);
    }

    @Override
    @Transactional(readOnly = true)
    public UserCollection getCollectionById(Long id) {
        return userCollectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found with id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public UserCollection getCollectionByUserId(Long userId) {
        return userCollectionRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found for user id: " + userId));
    }

    @Override
    @Transactional
    public UserCollection updateCollection(Long id, UserCollection collection) {
        UserCollection existingCollection = getCollectionById(id);

        // Actualizar solo campos permitidos
        existingCollection.setNCopies(collection.getNCopies());

        return userCollectionRepository.save(existingCollection);
    }

    @Override
    @Transactional
    public void deleteCollection(Long id) {
        UserCollection collection = getCollectionById(id);

        // Verificar si hay cartas en la colección antes de borrar
        if (!collection.getUserCollectionCards().isEmpty()) {
            throw new IllegalStateException("Cannot delete collection with id " + id +
                    " because it contains cards. Remove cards first.");
        }

        userCollectionRepository.delete(collection);
    }

    @Override
    @Transactional(readOnly = true)
    public Integer getTotalCardsInCollection(Long collectionId) {
        return getCollectionById(collectionId).getNCopies();
    }
}