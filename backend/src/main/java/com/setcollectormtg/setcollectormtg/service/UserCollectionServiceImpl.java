package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.model.UserCollection;
import com.setcollectormtg.setcollectormtg.model.UserCollectionCard;
import com.setcollectormtg.setcollectormtg.repository.UserCollectionRepository;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserCollectionServiceImpl implements UserCollectionService {

    private final UserCollectionRepository collectionRepository;
    private final UserRepository userRepository;

    @Override
    public UserCollection createCollection(UserCollection collection) {
        // Verificar que el usuario existe
        User user = userRepository.findById(collection.getUser().getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verificar que el usuario no tenga ya una colección
        if (collectionRepository.existsByUser_UserId(user.getUserId())) {
            throw new RuntimeException("User already has a collection");
        }

        collection.setUser(user);
        collection.setNCopies(0); // Inicializar con 0 cartas
        return collectionRepository.save(collection);
    }

    @Override
    public UserCollection getCollectionById(Long id) {
        return collectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Collection not found"));
    }

    @Override
    public UserCollection getCollectionByUserId(Long userId) {
        return collectionRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException("Collection not found for user"));
    }

    @Override
    public UserCollection updateCollection(Long id, UserCollection collectionDetails) {
        UserCollection collection = getCollectionById(id);

        // Actualizar el número de cartas si se proporciona
        if (collectionDetails.getNCopies() != null) {
            collection.setNCopies(collectionDetails.getNCopies());
        }

        // No permitir cambiar el usuario asociado
        return collectionRepository.save(collection);
    }

    @Override
    public void deleteCollection(Long id) {
        UserCollection collection = getCollectionById(id);
        collectionRepository.delete(collection);
    }

    @Override
    public Integer getTotalCardsInCollection(Long collectionId) {
        UserCollection collection = getCollectionById(collectionId);
        return collection.getUserCollectionCards().stream()
                .mapToInt(UserCollectionCard::getNCopies)
                .sum();
    }
}