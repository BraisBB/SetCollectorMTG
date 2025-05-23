package com.setcollectormtg.setcollectormtg.service;


import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.model.UserCollection;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;


import com.setcollectormtg.setcollectormtg.repository.UserCollectionRepository;
import com.setcollectormtg.setcollectormtg.dto.UserCollectionDto;
import com.setcollectormtg.setcollectormtg.mapper.UserCollectionMapper;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserCollectionServiceImpl implements UserCollectionService {

    private final UserCollectionRepository userCollectionRepository;
    private final UserCollectionMapper userCollectionMapper;
    private final UserRepository userRepository;

    /**
     * Crea una nueva colección para un usuario, validando que no exista previamente.
     * Inicializa el contador de cartas si es necesario.
     * Lanza excepción si el usuario ya tiene una colección.
     *
     * @param collectionDto DTO de la colección a crear
     * @return Colección creada y persistida como DTO
     */
    @Override
    @Transactional
    public UserCollectionDto createCollection(UserCollectionDto collectionDto) {
        var collection = userCollectionMapper.toEntity(collectionDto);
        if (userCollectionRepository.existsByUser_UserId(collection.getUser().getUserId())) {
            throw new IllegalStateException("User already has a collection");
        }
        if (collection.getTotalCards() == null) {
            collection.setTotalCards(0);
        }
        var saved = userCollectionRepository.save(collection);
        return userCollectionMapper.toDto(saved);
    }

    /**
     * Obtiene una colección por su ID.
     * Lanza excepción si no existe.
     *
     * @param id ID de la colección
     * @return Colección encontrada como DTO
     */
    @Override
    @Transactional(readOnly = true)
    public UserCollectionDto getCollectionById(Long id) {
        var collection = userCollectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found with id: " + id));
        return userCollectionMapper.toDto(collection);
    }

    /**
     * Obtiene la colección asociada a un usuario por su ID.
     * Lanza excepción si no existe.
     *
     * @param userId ID del usuario
     * @return Colección del usuario como DTO
     */
    @Override
    @Transactional(readOnly = true)
    public UserCollectionDto getCollectionByUserId(Long userId) {
        var collection = userCollectionRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found for user id: " + userId));
        return userCollectionMapper.toDto(collection);
    }

    /**
     * Obtiene la colección asociada a un usuario por su ID, o la crea si no existe.
     *
     * @param userId ID del usuario
     * @return Colección del usuario como DTO (existente o recién creada)
     */
    @Override
    @Transactional
    public UserCollectionDto getOrCreateCollectionByUserId(Long userId) {
        var optionalCollection = userCollectionRepository.findByUser_UserId(userId);
        
        if (optionalCollection.isPresent()) {
            return userCollectionMapper.toDto(optionalCollection.get());
        }
        
        // Buscar el usuario
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        // Crear nueva colección directamente
        UserCollection newCollection = new UserCollection();
        newCollection.setUser(user);
        newCollection.setTotalCards(0);
        
        UserCollection savedCollection = userCollectionRepository.save(newCollection);
        return userCollectionMapper.toDto(savedCollection);
    }

    /**
     * Actualiza los datos de una colección existente (solo campos permitidos).
     *
     * @param id         ID de la colección a actualizar
     * @param collectionDto DTO con los nuevos datos
     * @return Colección actualizada como DTO
     */
    @Override
    @Transactional
    public UserCollectionDto updateCollection(Long id, UserCollectionDto collectionDto) {
        var existingCollection = userCollectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found with id: " + id));
        existingCollection.setTotalCards(collectionDto.getTotalCards());
        var saved = userCollectionRepository.save(existingCollection);
        return userCollectionMapper.toDto(saved);
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
        var collection = userCollectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found with id: " + id));
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
        var collection = userCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found with id: " + collectionId));
        return collection.getTotalCards();
    }
}