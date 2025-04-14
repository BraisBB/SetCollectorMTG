package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.DeckCreateDto;
import com.setcollectormtg.setcollectormtg.dto.DeckDto;
import com.setcollectormtg.setcollectormtg.service.DeckService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/decks")
@RequiredArgsConstructor
public class DeckController {

    private final DeckService deckService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DeckDto>> getAllDecks() {
        return ResponseEntity.ok(deckService.getAllDecks());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') and @userSecurity.isOwner(authentication, #id) or hasRole('ADMIN')")
    public ResponseEntity<DeckDto> getDeckById(@PathVariable Long id) {
        return ResponseEntity.ok(deckService.getDeckById(id));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('USER') and @userSecurity.isOwner(authentication, #userId) or hasRole('ADMIN')")
    public ResponseEntity<List<DeckDto>> getDecksByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(deckService.getDecksByUser(userId));
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<DeckDto> createDeck(@Valid @RequestBody DeckCreateDto deckCreateDto) {
        DeckDto createdDeck = deckService.createDeck(deckCreateDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdDeck);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<DeckDto> updateDeck(
            @PathVariable Long id,
            @Valid @RequestBody DeckDto deckDto) {
        return ResponseEntity.ok(deckService.updateDeck(id, deckDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') and @userSecurity.isOwner(authentication, #id) or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDeck(@PathVariable Long id) {
        deckService.deleteDeck(id);
        return ResponseEntity.noContent().build();
    }
}