package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.CardCreateDto;
import com.setcollectormtg.setcollectormtg.dto.CardDto;
import com.setcollectormtg.setcollectormtg.service.CardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // Importa PreAuthorize
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cards")
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;

    // No necesita anotación si SecurityConfig ya permite GET público
    @GetMapping
    public ResponseEntity<List<CardDto>> getAllCards() {
        return ResponseEntity.ok(cardService.getAllCards());
    }

    // No necesita anotación si SecurityConfig ya permite GET público
    @GetMapping("/{id}")
    public ResponseEntity<CardDto> getCardById(@PathVariable Long id) {
        return ResponseEntity.ok(cardService.getCardById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')") // Solo usuarios con rol ADMIN
    public ResponseEntity<CardDto> createCard(@RequestBody CardCreateDto cardCreateDto) {
        return new ResponseEntity<>(cardService.createCard(cardCreateDto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Solo usuarios con rol ADMIN
    public ResponseEntity<CardDto> updateCard(@PathVariable Long id, @RequestBody CardDto cardDto) {
        return ResponseEntity.ok(cardService.updateCard(id, cardDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Solo usuarios con rol ADMIN
    public ResponseEntity<Void> deleteCard(@PathVariable Long id) {
        cardService.deleteCard(id);
        return ResponseEntity.noContent().build();
    }
}