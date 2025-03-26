package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.model.Card;
import com.setcollectormtg.setcollectormtg.repository.CardRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CardServiceImpl implements CardService {

    private final CardRepository cardRepository;

    @Override
    public List<Card> getAllCards() {
        return cardRepository.findAll();
    }

    @Override
    public Card getCardById(Long id) {
        return cardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Card not found with id: " + id));
    }

    @Override
    public Card saveCard(Card card) {
        return cardRepository.save(card);
    }

    @Override
    public Card updateCard(Long id, Card cardDetails) {
        Card card = getCardById(id);

        card.setName(cardDetails.getName());
        card.setRarity(cardDetails.getRarity());
        card.setOracleText(cardDetails.getOracleText());
        card.setManaValue(cardDetails.getManaValue());
        card.setManaCost(cardDetails.getManaCost());
        card.setCardType(cardDetails.getCardType());
        card.setImageUrl(cardDetails.getImageUrl());
        card.setSetMtg(cardDetails.getSetMtg());

        return cardRepository.save(card);
    }

    @Override
    public void deleteCard(Long id) {
        Card card = getCardById(id);
        cardRepository.delete(card);
    }
}