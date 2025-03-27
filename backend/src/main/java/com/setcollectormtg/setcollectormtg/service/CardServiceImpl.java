package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.CardCreateDto;
import com.setcollectormtg.setcollectormtg.dto.CardDto;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.mapper.CardMapper;
import com.setcollectormtg.setcollectormtg.model.Card;
import com.setcollectormtg.setcollectormtg.model.SetMtg;
import com.setcollectormtg.setcollectormtg.repository.CardRepository;
import com.setcollectormtg.setcollectormtg.repository.SetMtgRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CardServiceImpl implements CardService {

    private final CardRepository cardRepository;
    private final SetMtgRepository setMtgRepository;
    private final CardMapper cardMapper;

    @Override
    @Transactional(readOnly = true)
    public List<CardDto> getAllCards() {
        return cardRepository.findAll().stream()
                .map(cardMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CardDto getCardById(Long id) {
        return cardRepository.findById(id)
                .map(cardMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + id));
    }

    @Override
    @Transactional
    public CardDto createCard(CardCreateDto cardCreateDto) {
        SetMtg setMtg = setMtgRepository.findById(cardCreateDto.getSetId())
                .orElseThrow(() -> new ResourceNotFoundException("Set not found with id: " + cardCreateDto.getSetId()));

        Card card = cardMapper.toEntity(cardCreateDto);
        card.setSetMtg(setMtg);

        Card savedCard = cardRepository.save(card);
        return cardMapper.toDto(savedCard);
    }

    @Override
    @Transactional
    public CardDto updateCard(Long id, CardDto cardDto) {
        Card existingCard = cardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + id));

        cardMapper.updateCardFromDto(cardDto, existingCard);

        // Actualizar setMtg solo si es diferente
        if (cardDto.getSetId() != null &&
                (existingCard.getSetMtg() == null || !existingCard.getSetMtg().getSetId().equals(cardDto.getSetId()))) {
            SetMtg setMtg = setMtgRepository.findById(cardDto.getSetId())
                    .orElseThrow(() -> new ResourceNotFoundException("Set not found with id: " + cardDto.getSetId()));
            existingCard.setSetMtg(setMtg);
        }

        Card updatedCard = cardRepository.save(existingCard);
        return cardMapper.toDto(updatedCard);
    }

    @Override
    @Transactional
    public void deleteCard(Long id) {
        Card card = cardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found with id: " + id));
        cardRepository.delete(card);
    }
}