package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.model.Deck;
import com.setcollectormtg.setcollectormtg.service.DeckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/decks")
@RequiredArgsConstructor
public class DeckController {

    private final DeckService deckService;

    @GetMapping
    public ResponseEntity<List<Deck>> getAllDecks() {
        return ResponseEntity.ok(deckService.getAllDecks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Deck> getDeckById(@PathVariable Long id) {
        return ResponseEntity.ok(deckService.getDeckById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Deck>> getDecksByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(deckService.getDecksByUser(userId));
    }

    @PostMapping
    public ResponseEntity<Deck> createDeck(@RequestBody Deck deck) {
        return ResponseEntity.ok(deckService.createDeck(deck));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Deck> updateDeck(@PathVariable Long id, @RequestBody Deck deck) {
        return ResponseEntity.ok(deckService.updateDeck(id, deck));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDeck(@PathVariable Long id) {
        deckService.deleteDeck(id);
        return ResponseEntity.noContent().build();
    }
}