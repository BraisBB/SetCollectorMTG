package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.CardDeckDto;
import com.setcollectormtg.setcollectormtg.service.CardDeckService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/decks/{deckId}/cards")
@RequiredArgsConstructor
@Slf4j
public class CardDeckController {

    private final CardDeckService cardDeckService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER', 'ADMIN', 'ROLE_ADMIN') and @userSecurity.isOwner(authentication, #deckId)")
    public ResponseEntity<List<CardDeckDto>> getAllCardsInDeck(
            @PathVariable Long deckId, 
            Authentication authentication) {
        log.debug("Usuario {} solicitando cartas del mazo {}", 
                authentication != null ? authentication.getName() : "anónimo", deckId);
        List<CardDeckDto> cards = cardDeckService.getAllCardsInDeck(deckId);
        log.info("Retornando {} cartas para el mazo {}", cards.size(), deckId);
        // Depurar los valores de nCopies
        for (CardDeckDto card : cards) {
            log.info("Carta ID: {}, Nombre: {}, nCopies: {}", 
                    card.getCardId(), card.getCardName(), card.getNCopies());
        }
        return ResponseEntity.ok(cards);
    }

    @PostMapping("/{cardId}")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER') and @userSecurity.isOwner(authentication, #deckId)")
    public ResponseEntity<CardDeckDto> addCardToDeck(
            @PathVariable Long deckId,
            @PathVariable Long cardId,
            @RequestParam(defaultValue = "1") Integer quantity) {
        return new ResponseEntity<>(
                cardDeckService.addCardToDeck(deckId, cardId, quantity),
                HttpStatus.CREATED);
    }

    @PutMapping("/{cardId}")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER') and @userSecurity.isOwner(authentication, #deckId)")
    public ResponseEntity<CardDeckDto> updateCardQuantity(
            @PathVariable Long deckId,
            @PathVariable Long cardId,
            @RequestParam Integer quantity) {
        return ResponseEntity.ok(
                cardDeckService.updateCardQuantity(deckId, cardId, quantity));
    }

    @DeleteMapping("/{cardId}")
    @PreAuthorize("(hasAnyAuthority('USER', 'ROLE_USER') and @userSecurity.isOwner(authentication, #deckId)) or hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Void> removeCardFromDeck(
            @PathVariable Long deckId,
            @PathVariable Long cardId) {
        cardDeckService.removeCardFromDeck(deckId, cardId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{cardId}")
    @PreAuthorize("(hasAnyAuthority('USER', 'ROLE_USER') and @userSecurity.isOwner(authentication, #deckId)) or hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<CardDeckDto> getCardDeckInfo(
            @PathVariable Long deckId,
            @PathVariable Long cardId) {
        return ResponseEntity.ok(
                cardDeckService.getCardDeckInfo(deckId, cardId));
    }

    @GetMapping("/{cardId}/quantity")
    @PreAuthorize("(hasAnyAuthority('USER', 'ROLE_USER') and @userSecurity.isOwner(authentication, #deckId)) or hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Integer> getCardQuantity(
            @PathVariable Long deckId,
            @PathVariable Long cardId) {
        return ResponseEntity.ok(
                cardDeckService.getCardCountInDeck(deckId, cardId));
    }
}