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

    /**
     * Gets all cards in a deck. Accessible by ADMIN (for moderation) or the deck owner.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN') or (hasAuthority('USER') and @userSecurity.isOwner(authentication, #deckId))")
    public ResponseEntity<List<CardDeckDto>> getAllCardsInDeck(
            @PathVariable Long deckId, 
            Authentication authentication) {
        log.debug("User {} requesting cards from deck {}", 
                authentication != null ? authentication.getName() : "anonymous", deckId);
        List<CardDeckDto> cards = cardDeckService.getAllCardsInDeck(deckId);
        log.info("Returning {} cards for deck {}", cards.size(), deckId);
        // Debug nCopies values
        for (CardDeckDto card : cards) {
            log.info("Card ID: {}, Name: {}, nCopies: {}", 
                    card.getCardId(), card.getCardName(), card.getNCopies());
        }
        return ResponseEntity.ok(cards);
    }

    /**
     * Adds a card to a deck. Accessible by the deck owner only.
     */
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

    /**
     * Updates the quantity of a card in a deck. Accessible by the deck owner only.
     */
    @PutMapping("/{cardId}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #deckId)")
    public ResponseEntity<CardDeckDto> updateCardQuantity(
            @PathVariable Long deckId,
            @PathVariable Long cardId,
            @RequestParam Integer quantity) {
        return ResponseEntity.ok(
                cardDeckService.updateCardQuantity(deckId, cardId, quantity));
    }

    /**
     * Removes a card from a deck. Accessible by ADMIN or the deck owner.
     */
    @DeleteMapping("/{cardId}")
    @PreAuthorize("(hasAuthority('USER') and @userSecurity.isOwner(authentication, #deckId)) or hasAuthority('ADMIN')")
    public ResponseEntity<Void> removeCardFromDeck(
            @PathVariable Long deckId,
            @PathVariable Long cardId) {
        cardDeckService.removeCardFromDeck(deckId, cardId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Gets information about a specific card in a deck. Accessible by ADMIN or the deck owner.
     */
    @GetMapping("/{cardId}")
    @PreAuthorize("(hasAuthority('USER') and @userSecurity.isOwner(authentication, #deckId)) or hasAuthority('ADMIN')")
    public ResponseEntity<CardDeckDto> getCardDeckInfo(
            @PathVariable Long deckId,
            @PathVariable Long cardId) {
        return ResponseEntity.ok(
                cardDeckService.getCardDeckInfo(deckId, cardId));
    }

    /**
     * Gets the quantity of a specific card in a deck. Accessible by ADMIN or the deck owner.
     */
    @GetMapping("/{cardId}/quantity")
    @PreAuthorize("(hasAuthority('USER') and @userSecurity.isOwner(authentication, #deckId)) or hasAuthority('ADMIN')")
    public ResponseEntity<Integer> getCardQuantity(
            @PathVariable Long deckId,
            @PathVariable Long cardId) {
        return ResponseEntity.ok(
                cardDeckService.getCardCountInDeck(deckId, cardId));
    }
}