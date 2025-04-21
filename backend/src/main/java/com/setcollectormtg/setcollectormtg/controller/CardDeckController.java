package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.CardDeckDto;
import com.setcollectormtg.setcollectormtg.service.CardDeckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/decks/{deckId}/cards")
@RequiredArgsConstructor
public class CardDeckController {

    private final CardDeckService cardDeckService;

    @PostMapping("/{cardId}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #deckId)")
    public ResponseEntity<CardDeckDto> addCardToDeck(
            @PathVariable Long deckId,
            @PathVariable Long cardId,
            @RequestParam(defaultValue = "1") Integer quantity) {
        return new ResponseEntity<>(
                cardDeckService.addCardToDeck(deckId, cardId, quantity),
                HttpStatus.CREATED);
    }

    @PutMapping("/{cardId}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #deckId)")
    public ResponseEntity<CardDeckDto> updateCardQuantity(
            @PathVariable Long deckId,
            @PathVariable Long cardId,
            @RequestParam Integer quantity) {
        return ResponseEntity.ok(
                cardDeckService.updateCardQuantity(deckId, cardId, quantity));
    }

    @DeleteMapping("/{cardId}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #deckId) or hasRole('ADMIN')")
    public ResponseEntity<Void> removeCardFromDeck(
            @PathVariable Long deckId,
            @PathVariable Long cardId) {
        cardDeckService.removeCardFromDeck(deckId, cardId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{cardId}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #deckId) or hasRole('ADMIN')")
    public ResponseEntity<CardDeckDto> getCardDeckInfo(
            @PathVariable Long deckId,
            @PathVariable Long cardId) {
        return ResponseEntity.ok(
                cardDeckService.getCardDeckInfo(deckId, cardId));
    }

    @GetMapping("/{cardId}/quantity")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #deckId) or hasRole('ADMIN')")
    public ResponseEntity<Integer> getCardQuantity(
            @PathVariable Long deckId,
            @PathVariable Long cardId) {
        return ResponseEntity.ok(
                cardDeckService.getCardCountInDeck(deckId, cardId));
    }
}