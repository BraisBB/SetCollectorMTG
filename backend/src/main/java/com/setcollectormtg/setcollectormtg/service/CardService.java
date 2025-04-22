package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.CardCreateDto;
import com.setcollectormtg.setcollectormtg.dto.CardDto;
import java.util.List;

public interface CardService {
    List<CardDto> getAllCards();

    CardDto getCardById(Long id);

    CardDto createCard(CardCreateDto cardCreateDto);

    CardDto updateCard(Long id, CardDto cardDto);

    void deleteCard(Long id);
}