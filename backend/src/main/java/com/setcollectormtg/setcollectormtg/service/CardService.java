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

    List<CardDto> getCardsByName(String name);

    List<CardDto> getCardsByType(String cardType);

    List<CardDto> getCardsByColor(String colorSymbol);

    List<CardDto> getCardsByFilters(String name, String cardType, String colorSymbol, String setCode, String rarity, Integer manaCostMin, Integer manaCostMax);
}