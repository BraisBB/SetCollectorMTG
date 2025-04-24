package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.UserCollectionCardDto;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.mapper.UserCollectionCardMapper;
import com.setcollectormtg.setcollectormtg.model.*;
import com.setcollectormtg.setcollectormtg.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserCollectionCardServiceImpl implements UserCollectionCardService {

    private final UserCollectionCardRepository userCollectionCardRepository;
    private final UserCollectionRepository userCollectionRepository;
    private final CardRepository cardRepository;
    private final UserCollectionCardMapper mapper;

    /**
     * Agrega una carta a la colección de un usuario. Lanza excepción si la carta ya existe en la colección.
     *
     * @param collectionId ID de la colección de usuario
     * @param cardId       ID de la carta
     * @param quantity     Cantidad de copias a agregar
     * @return DTO de la carta agregada a la colección
     */
    @Override
    @Transactional
    public UserCollectionCardDto addCardToCollection(Long collectionId, Long cardId, Integer quantity) {
        UserCollection collection = userCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found"));

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        if (userCollectionCardRepository.existsByUserCollection_CollectionIdAndCard_CardId(collectionId, cardId)) {
            throw new IllegalStateException("Card already exists in collection");
        }

        UserCollectionCard userCollectionCard = new UserCollectionCard();
        userCollectionCard.setId(new UserCollectionCardId(collectionId, cardId));
        userCollectionCard.setUserCollection(collection);
        userCollectionCard.setCard(card);
        userCollectionCard.setNCopies(quantity);

        updateCollectionTotalCards(collection, quantity);

        return mapper.toDto(userCollectionCardRepository.save(userCollectionCard));
    }

    /**
     * Actualiza la cantidad de copias de una carta en la colección de un usuario.
     * Lanza excepción si la cantidad es inválida o la carta no existe en la colección.
     *
     * @param collectionId ID de la colección de usuario
     * @param cardId       ID de la carta
     * @param newQuantity  Nueva cantidad de copias
     * @return DTO actualizado de la carta en la colección
     */
    @Override
    @Transactional
    public UserCollectionCardDto updateCardQuantity(Long collectionId, Long cardId, Integer newQuantity) {
        if (newQuantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }

        UserCollectionCard userCollectionCard = userCollectionCardRepository
                .findByUserCollection_CollectionIdAndCard_CardId(collectionId, cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found in collection"));

        int difference = newQuantity - userCollectionCard.getNCopies();
        updateCollectionTotalCards(userCollectionCard.getUserCollection(), difference);

        userCollectionCard.setNCopies(newQuantity);
        return mapper.toDto(userCollectionCardRepository.save(userCollectionCard));
    }

    /**
     * Elimina una carta de la colección de un usuario y actualiza el contador total de cartas.
     * Lanza excepción si la carta no existe en la colección.
     *
     * @param collectionId ID de la colección de usuario
     * @param cardId       ID de la carta
     */
    @Override
    @Transactional
    public void removeCardFromCollection(Long collectionId, Long cardId) {
        UserCollectionCard userCollectionCard = userCollectionCardRepository
                .findByUserCollection_CollectionIdAndCard_CardId(collectionId, cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found in collection"));

        updateCollectionTotalCards(userCollectionCard.getUserCollection(), -userCollectionCard.getNCopies());
        userCollectionCardRepository.delete(userCollectionCard);
    }

    /**
     * Obtiene la información detallada de una carta en la colección de un usuario.
     *
     * @param collectionId ID de la colección de usuario
     * @param cardId       ID de la carta
     * @return DTO de la carta en la colección
     */
    @Override
    @Transactional(readOnly = true)
    public UserCollectionCardDto getCardCollectionInfo(Long collectionId, Long cardId) {
        return userCollectionCardRepository
                .findByUserCollection_CollectionIdAndCard_CardId(collectionId, cardId)
                .map(mapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found in collection"));
    }

    /**
     * Obtiene la cantidad de copias de una carta en la colección de un usuario.
     *
     * @param collectionId ID de la colección de usuario
     * @param cardId       ID de la carta
     * @return Número de copias de la carta en la colección
     */
    @Override
    @Transactional(readOnly = true)
    public Integer getCardCountInCollection(Long collectionId, Long cardId) {
        return userCollectionCardRepository
                .findByUserCollection_CollectionIdAndCard_CardId(collectionId, cardId)
                .map(UserCollectionCard::getNCopies)
                .orElse(0);
    }

    /**
     * Actualiza el contador total de cartas en la colección de usuario.
     *
     * @param collection         Colección de usuario
     * @param quantityDifference Diferencia de cantidad a sumar/restar
     */
    private void updateCollectionTotalCards(UserCollection collection, int quantityDifference) {
        collection.setTotalCards(collection.getTotalCards() + quantityDifference);
        userCollectionRepository.save(collection);
    }
}