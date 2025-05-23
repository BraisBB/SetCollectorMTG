package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.DeckCreateDto;
import com.setcollectormtg.setcollectormtg.dto.DeckDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface DeckService {
    List<DeckDto> getAllDecks();

    DeckDto getDeckById(Long id);

    DeckDto createDeck(DeckCreateDto deckCreateDto);

    DeckDto updateDeck(Long id, DeckDto deckDto);

    void deleteDeck(Long id);

    List<DeckDto> getDecksByUser(Long userId);
    
    /**
     * Busca los mazos de un usuario por su nombre de usuario
     * @param username El nombre de usuario a buscar
     * @return Lista de mazos pertenecientes al usuario
     */
    List<DeckDto> getDecksByUsername(String username);
    
    

    int getCardCountInDeck(Long deckId);

    Page<DeckDto> getDecksByUserPaged(Long userId, Pageable pageable);
    
    /**
     * Actualiza el color del mazo basado en las cartas que contiene
     * @param deckId ID del mazo a actualizar
     * @return DTO del mazo actualizado con su nuevo color
     */
    DeckDto updateDeckColor(Long deckId);
}