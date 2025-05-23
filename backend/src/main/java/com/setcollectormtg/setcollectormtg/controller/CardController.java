package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.CardCreateDto;
import com.setcollectormtg.setcollectormtg.dto.CardDto;
import com.setcollectormtg.setcollectormtg.service.CardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/cards")
@RequiredArgsConstructor
@Slf4j
public class CardController {

    private final CardService cardService;

    /**
     * Gets all cards or filters them by parameters if present.
     * This endpoint is public - no authentication required.
     *
     * @param name        Card name or part of the name (optional)
     * @param type        Card type (optional)
     * @param color       Card color (W, U, B, R, G or colorless) (optional)
     * @param setCode     Set code (optional)
     * @param rarity      Card rarity (optional)
     * @param manaCostMin Minimum mana cost (optional)
     * @param manaCostMax Maximum mana cost (optional)
     * @return List of all cards or filtered cards
     */
    @GetMapping
    public ResponseEntity<List<CardDto>> getAllCards(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String setCode,
            @RequestParam(required = false) String rarity,
            @RequestParam(required = false) Integer manaCostMin,
            @RequestParam(required = false) Integer manaCostMax) {

        log.debug("Getting cards with filters: name={}, type={}, color={}, setCode={}, rarity={}, manaCost={}-{}",
                name, type, color, setCode, rarity, manaCostMin, manaCostMax);

        List<CardDto> cards;

        // If any filter is applied, use filtered search
        if (name != null || type != null || color != null || setCode != null || rarity != null || manaCostMin != null
                || manaCostMax != null) {
            cards = cardService.getCardsByFilters(name, type, color, setCode, rarity, manaCostMin, manaCostMax);
            log.debug("Found {} cards with filters", cards.size());
        } else {
            // If no filters, return all cards
            cards = cardService.getAllCards();
            log.debug("Retrieved all {} cards", cards.size());
        }

        return ResponseEntity.ok(cards);
    }

    /**
     * Gets a card by its ID. This endpoint is public - no authentication required.
     *
     * @param id Card ID
     * @return Found card
     */
    @GetMapping("/{id}")
    public ResponseEntity<CardDto> getCardById(@PathVariable Long id) {
        log.debug("Getting card by ID: {}", id);
        return ResponseEntity.ok(cardService.getCardById(id));
    }

    /**
     * Searches cards applying filters. This endpoint is public - no authentication
     * required.
     * 
     * @param name        Card name or part of the name (optional)
     * @param cardType    Card type (optional)
     * @param color       Card color (W, U, B, R, G or colorless) (optional)
     * @param setCode     Set code (optional)
     * @param rarity      Card rarity (optional)
     * @param manaCostMin Minimum mana cost (optional)
     * @param manaCostMax Maximum mana cost (optional)
     * @return List of cards that meet the criteria
     */
    @GetMapping("/search")
    public ResponseEntity<List<CardDto>> searchCards(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String cardType,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String setCode,
            @RequestParam(required = false) String rarity,
            @RequestParam(required = false) Integer manaCostMin,
            @RequestParam(required = false) Integer manaCostMax) {

        log.debug("Searching cards with filters: name={}, cardType={}, color={}, setCode={}, rarity={}, manaCost={}-{}",
                name, cardType, color, setCode, rarity, manaCostMin, manaCostMax);

        List<CardDto> results = cardService.getCardsByFilters(name, cardType, color, setCode, rarity, manaCostMin,
                manaCostMax);
        log.debug("Search returned {} cards", results.size());

        return ResponseEntity.ok(results);
    }

    /**
     * Creates a new card. Requires ADMIN authority.
     *
     * @param cardCreateDto DTO with the card data to create
     * @return Created card
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<CardDto> createCard(@Valid @RequestBody CardCreateDto cardCreateDto) {
        log.debug("Creating new card: {}", cardCreateDto.getName());
        CardDto createdCard = cardService.createCard(cardCreateDto);
        log.info("Card created successfully with ID: {}", createdCard.getCardId());
        return new ResponseEntity<>(createdCard, HttpStatus.CREATED);
    }

    /**
     * Updates an existing card. Requires ADMIN authority.
     *
     * @param id      ID of the card to update
     * @param cardDto DTO with the new data
     * @return Updated card
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<CardDto> updateCard(@PathVariable Long id, @Valid @RequestBody CardDto cardDto) {
        log.info("Received request to update card with ID: {}", id);
        log.debug("Received data: {}", cardDto);

        CardDto updatedCard = cardService.updateCard(id, cardDto);
        log.info("Card updated successfully: {}", updatedCard.getName());

        return ResponseEntity.ok(updatedCard);
    }

    /**
     * Deletes a card. Requires ADMIN authority.
     *
     * @param id ID of the card to delete
     * @return Response with no content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteCard(@PathVariable Long id) {
        log.debug("Deleting card with ID: {}", id);
        cardService.deleteCard(id);
        log.info("Card with ID {} deleted successfully", id);
        return ResponseEntity.noContent().build();
    }
}