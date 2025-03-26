package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.CardCreateDto;
import com.setcollectormtg.setcollectormtg.dto.CardDto;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.model.Card;
import com.setcollectormtg.setcollectormtg.model.SetMtg;
import com.setcollectormtg.setcollectormtg.repository.CardRepository;
import com.setcollectormtg.setcollectormtg.repository.SetMtgRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CardServiceImpl implements CardService {

    private final CardRepository cardRepository;
    private final SetMtgRepository setMtgRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CardDto> getAllCards() {
        return cardRepository.findAll().stream()
                .map(CardDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CardDto getCardById(Long id) {
        return cardRepository.findById(id)
                .map(CardDto::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + id));
    }

    @Override
    @Transactional
    public CardDto createCard(CardCreateDto cardDto) {
        SetMtg setMtg = setMtgRepository.findById(cardDto.getSetId())
                .orElseThrow(() -> new ResourceNotFoundException("Set not found with id: " + cardDto.getSetId()));

        Card card = new Card();
        card.setName(cardDto.getName());
        card.setRarity(cardDto.getRarity());
        card.setOracleText(cardDto.getOracleText());
        card.setManaValue(cardDto.getManaValue());
        card.setManaCost(cardDto.getManaCost());
        card.setCardType(cardDto.getCardType());
        card.setImageUrl(cardDto.getImageUrl());
        card.setSetMtg(setMtg);

        Card savedCard = cardRepository.save(card);
        return CardDto.fromEntity(savedCard);
    }

    @Override
    @Transactional
    public CardDto updateCard(Long id, CardDto cardDto) {
        Card existingCard = cardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + id));

        existingCard.setName(cardDto.getName());
        existingCard.setRarity(cardDto.getRarity());
        existingCard.setOracleText(cardDto.getOracleText());
        existingCard.setManaValue(cardDto.getManaValue());
        existingCard.setManaCost(cardDto.getManaCost());
        existingCard.setCardType(cardDto.getCardType());
        existingCard.setImageUrl(cardDto.getImageUrl());

        // Actualizar setMtg solo si es diferente
        if (cardDto.getSetId() != null &&
                (existingCard.getSetMtg() == null || !existingCard.getSetMtg().getSetId().equals(cardDto.getSetId()))) {
            SetMtg setMtg = setMtgRepository.findById(cardDto.getSetId())
                    .orElseThrow(() -> new ResourceNotFoundException("Set not found with id: " + cardDto.getSetId()));
            existingCard.setSetMtg(setMtg);
        }

        Card updatedCard = cardRepository.save(existingCard);
        return CardDto.fromEntity(updatedCard);
    }

    @Override
    @Transactional
    public void deleteCard(Long id) {
        Card card = cardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + id));
        cardRepository.delete(card);
    }
}