package com.setcollectormtg.setcollectormtg.mapper;

import com.setcollectormtg.setcollectormtg.dto.DeckCreateDto;
import com.setcollectormtg.setcollectormtg.dto.DeckDto;
import com.setcollectormtg.setcollectormtg.model.Deck;
import com.setcollectormtg.setcollectormtg.model.User;
import org.springframework.stereotype.Component;

@Component
public class DeckMapper {

    public DeckDto toDto(Deck deck) {
        DeckDto dto = new DeckDto();
        dto.setDeckId(deck.getDeckId());
        dto.setDeckName(deck.getDeckName());
        dto.setGameType(deck.getGameType());
        dto.setDeckColor(deck.getDeckColor());
        dto.setTotalCards(deck.getTotalCards());
        dto.setUserId(deck.getUser().getUserId());
        return dto;
    }

    public Deck toEntity(DeckCreateDto dto, User user) {
        Deck deck = new Deck();
        deck.setDeckName(dto.getDeckName());
        deck.setGameType(dto.getGameType());
        deck.setDeckColor(dto.getDeckColor());
        deck.setUser(user);
        return deck;
    }
}