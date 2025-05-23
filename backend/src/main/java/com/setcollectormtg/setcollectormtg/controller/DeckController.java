package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.DeckCreateDto;
import com.setcollectormtg.setcollectormtg.dto.DeckDto;
import com.setcollectormtg.setcollectormtg.service.DeckService;
import com.setcollectormtg.setcollectormtg.util.CurrentUserUtil;
import com.setcollectormtg.setcollectormtg.model.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/decks")
@RequiredArgsConstructor
@Slf4j
public class DeckController {

    private final DeckService deckService;
    private final CurrentUserUtil currentUserUtil;

    @GetMapping("/admin")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<DeckDto>> getAllDecks() {
        log.debug("Getting all decks (admin endpoint)");
        return ResponseEntity.ok(deckService.getAllDecks());
    }

    /**
     * Gets a specific deck by ID. Accessible by ADMIN (for moderation) or the deck owner.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or (hasAuthority('USER') and @userSecurity.isOwner(authentication, #id))")
    public ResponseEntity<DeckDto> getDeckById(@PathVariable Long id) {
        return ResponseEntity.ok(deckService.getDeckById(id));
    }

    /**
     * Gets decks by user ID. Accessible by ADMIN (for moderation) or the user themselves.
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('ADMIN') or (hasAuthority('USER') and @userSecurity.isOwner(authentication, #userId))")
    public ResponseEntity<List<DeckDto>> getDecksByUserId(@PathVariable Long userId) {
        log.info("Requesting decks for user with ID: {}", userId);
        return ResponseEntity.ok(deckService.getDecksByUser(userId));
    }

    /**
     * Gets decks by username. Accessible by ADMIN (for moderation) or the user themselves.
     */
    @GetMapping("/user/byUsername/{username}")
    @PreAuthorize("hasAuthority('ADMIN') or (hasAuthority('USER') and @userSecurity.canAccessUserByUsername(authentication, #username))")
    public ResponseEntity<List<DeckDto>> getDecksByUsername(@PathVariable String username) {
        log.info("Requesting decks for user with username: {}", username);
        return ResponseEntity.ok(deckService.getDecksByUsername(username));
    }
    
    /**
     * Gets decks for the current authenticated user. USER authority only.
     */
    @GetMapping("/current-user")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<List<DeckDto>> getDecksForCurrentUser() {
        log.info("Requesting decks for the currently authenticated user");
        
        User currentUser = currentUserUtil.getCurrentUser();
        if (currentUser == null) {
            log.warn("Could not get current user");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        log.info("Authenticated user with ID: {}, username: {}", 
                currentUser.getUserId(), currentUser.getUsername());
        
        return ResponseEntity.ok(deckService.getDecksByUser(currentUser.getUserId()));
    }

    /**
     * Gets decks by user with pagination. Accessible by the user themselves only.
     */
    @GetMapping("/user/{userId}/paged")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #userId)")
    public ResponseEntity<Page<DeckDto>> getDecksByUserPaged(@PathVariable Long userId, Pageable pageable) {
        return ResponseEntity.ok(deckService.getDecksByUserPaged(userId, pageable));
    }

    /**
     * Creates a new deck. USER authority only.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<DeckDto> createDeck(@Valid @RequestBody DeckCreateDto deckCreateDto) {
        try {
            log.info("Deck creation request received: {}", deckCreateDto);
            
            // Explicitly validate that the DTO is correct
            if (deckCreateDto.getDeckName() == null || deckCreateDto.getDeckName().trim().isEmpty()) {
                log.warn("Attempt to create deck with empty name");
                return ResponseEntity.badRequest().build();
            }
            
            // Create the deck
            DeckDto createdDeck = deckService.createDeck(deckCreateDto);
            log.info("Deck successfully created with ID: {}", createdDeck.getDeckId());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(createdDeck);
        } catch (Exception e) {
            log.error("Error creating deck: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Updates a deck. Accessible by the deck owner only.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<DeckDto> updateDeck(
            @PathVariable Long id,
            @Valid @RequestBody DeckDto deckDto) {
        return ResponseEntity.ok(deckService.updateDeck(id, deckDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("(hasAuthority('USER') and @userSecurity.isOwner(authentication, #id)) or hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteDeck(@PathVariable Long id) {
        deckService.deleteDeck(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Updates deck color based on cards. Accessible by the deck owner only.
     */
    @GetMapping("/{id}/update-color")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<DeckDto> updateDeckColor(@PathVariable Long id) {
        return ResponseEntity.ok(deckService.updateDeckColor(id));
    }
}