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

    @Override
    @Transactional
    public void removeCardFromCollection(Long collectionId, Long cardId) {
        UserCollectionCard userCollectionCard = userCollectionCardRepository
                .findByUserCollection_CollectionIdAndCard_CardId(collectionId, cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found in collection"));

        updateCollectionTotalCards(userCollectionCard.getUserCollection(), -userCollectionCard.getNCopies());
        userCollectionCardRepository.delete(userCollectionCard);
    }

    @Override
    @Transactional(readOnly = true)
    public UserCollectionCardDto getCardCollectionInfo(Long collectionId, Long cardId) {
        return userCollectionCardRepository
                .findByUserCollection_CollectionIdAndCard_CardId(collectionId, cardId)
                .map(mapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found in collection"));
    }

    @Override
    @Transactional(readOnly = true)
    public Integer getCardCountInCollection(Long collectionId, Long cardId) {
        return userCollectionCardRepository
                .findByUserCollection_CollectionIdAndCard_CardId(collectionId, cardId)
                .map(UserCollectionCard::getNCopies)
                .orElse(0);
    }

    private void updateCollectionTotalCards(UserCollection collection, int quantityDifference) {
        collection.setNCopies(collection.getNCopies() + quantityDifference);
        userCollectionRepository.save(collection);
    }
}