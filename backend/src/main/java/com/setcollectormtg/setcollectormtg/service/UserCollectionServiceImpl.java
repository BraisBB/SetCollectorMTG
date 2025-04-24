package com.setcollectormtg.setcollectormtg.service;


import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;


import com.setcollectormtg.setcollectormtg.model.UserCollection;
import com.setcollectormtg.setcollectormtg.repository.UserCollectionRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserCollectionServiceImpl implements UserCollectionService {

    private final UserCollectionRepository userCollectionRepository;


    /**
     * Crea una nueva colección para un usuario, validando que no exista previamente.
     * Inicializa el contador de cartas si es necesario.
     * Lanza excepción si el usuario ya tiene una colección.
     *
     * @param collection Entidad UserCollection a crear
     * @return Colección creada y persistida
     */
    @Override
    @Transactional
    public UserCollection createCollection(UserCollection collection) {
        // Verificamos si ya existe una colección para este usuario
        if (userCollectionRepository.existsByUser_UserId(collection.getUser().getUserId())) {
            throw new IllegalStateException("User already has a collection");
        }

        // Configuración básica de la colección
        if (collection.getTotalCards() == null) {
            collection.setTotalCards(0);
        }

        return userCollectionRepository.save(collection);
    }

    /**
     * Obtiene una colección por su ID.
     * Lanza excepción si no existe.
     *
     * @param id ID de la colección
     * @return Colección encontrada
     */
    @Override
    @Transactional(readOnly = true)
    public UserCollection getCollectionById(Long id) {
        return userCollectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found with id: " + id));
    }

    /**
     * Obtiene la colección asociada a un usuario por su ID.
     * Lanza excepción si no existe.
     *
     * @param userId ID del usuario
     * @return Colección del usuario
     */
    @Override
    @Transactional(readOnly = true)
    public UserCollection getCollectionByUserId(Long userId) {
        return userCollectionRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found for user id: " + userId));
    }

    /**
     * Actualiza los datos de una colección existente (solo campos permitidos).
     *
     * @param id         ID de la colección a actualizar
     * @param collection Entidad con los nuevos datos
     * @return Colección actualizada
     */
    @Override
    @Transactional
    public UserCollection updateCollection(Long id, UserCollection collection) {
        UserCollection existingCollection = getCollectionById(id);

        // Actualizar solo campos permitidos
        existingCollection.setTotalCards(collection.getTotalCards());

        return userCollectionRepository.save(existingCollection);
    }

    /**
     * Elimina una colección si no contiene cartas asociadas.
     * Lanza excepción si la colección tiene cartas.
     *
     * @param id ID de la colección a eliminar
     */
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

    /**
     * Obtiene el total de cartas en una colección por su ID.
     *
     * @param collectionId ID de la colección
     * @return Número total de cartas en la colección
     */
    @Override
    @Transactional(readOnly = true)
    public Integer getTotalCardsInCollection(Long collectionId) {
        return getCollectionById(collectionId).getTotalCards();
    }
}