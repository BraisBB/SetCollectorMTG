package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.DeckCreateDto;
import com.setcollectormtg.setcollectormtg.dto.DeckDto;
import com.setcollectormtg.setcollectormtg.service.DeckService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
public class DeckController {

    private final DeckService deckService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<DeckDto>> getAllDecks() {
        return ResponseEntity.ok(deckService.getAllDecks());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<DeckDto> getDeckById(@PathVariable Long id) {
        return ResponseEntity.ok(deckService.getDeckById(id));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #userId)")
    public ResponseEntity<List<DeckDto>> getDecksByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(deckService.getDecksByUser(userId));
    }

    @GetMapping("/user/{userId}/paged")
    @PreAuthorize("@userSecurity.isOwner(authentication, #userId)")
    public ResponseEntity<Page<DeckDto>> getDecksByUserPaged(@PathVariable Long userId, Pageable pageable) {
        return ResponseEntity.ok(deckService.getDecksByUserPaged(userId, pageable));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<DeckDto> createDeck(@Valid @RequestBody DeckCreateDto deckCreateDto) {
        DeckDto createdDeck = deckService.createDeck(deckCreateDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdDeck);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<DeckDto> updateDeck(
            @PathVariable Long id,
            @Valid @RequestBody DeckDto deckDto) {
        return ResponseEntity.ok(deckService.updateDeck(id, deckDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<Void> deleteDeck(@PathVariable Long id) {
        deckService.deleteDeck(id);
        return ResponseEntity.noContent().build();
    }
}