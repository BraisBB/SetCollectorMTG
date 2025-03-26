package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.model.Card;
import java.util.List;

public interface CardService {
    List<Card> getAllCards();
    Card getCardById(Long id);
    Card saveCard(Card card);
    Card updateCard(Long id, Card card);
    void deleteCard(Long id);
}