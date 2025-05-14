package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.DeckCreateDto;
import com.setcollectormtg.setcollectormtg.dto.DeckDto;
import com.setcollectormtg.setcollectormtg.service.DeckService;
import com.setcollectormtg.setcollectormtg.service.AuthService;
import com.setcollectormtg.setcollectormtg.model.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/decks")
@RequiredArgsConstructor
@Slf4j
public class DeckController {

    private final DeckService deckService;
    private final AuthService authService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<DeckDto>> getAllDecks() {
        return ResponseEntity.ok(deckService.getAllDecks());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<DeckDto> getDeckById(@PathVariable Long id, Authentication authentication) {
        log.info("Usuario {} solicitando mazo con ID: {}", 
                authentication != null ? authentication.getName() : "anónimo", id);
        return ResponseEntity.ok(deckService.getDeckById(id));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #userId)")
    public ResponseEntity<List<DeckDto>> getDecksByUser(@PathVariable Long userId) {
        log.info("Solicitando mazos para usuario con ID: {}", userId);
        return ResponseEntity.ok(deckService.getDecksByUser(userId));
    }

    @GetMapping("/user/byUsername/{username}")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<List<DeckDto>> getDecksByUsername(@PathVariable String username) {
        log.info("Solicitando mazos para usuario con username: {}", username);
        return ResponseEntity.ok(deckService.getDecksByUsername(username));
    }
    
    @GetMapping("/current-user")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<List<DeckDto>> getDecksForCurrentUser() {
        log.info("Solicitando mazos para el usuario autenticado actualmente");
        
        User currentUser = authService.getCurrentUser();
        if (currentUser == null) {
            log.warn("No se pudo obtener el usuario actual");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        log.info("Usuario autenticado con ID: {}, keycloakId: {}", 
                currentUser.getUserId(), currentUser.getKeycloakId());
        
        return ResponseEntity.ok(deckService.getDecksByUser(currentUser.getUserId()));
    }

    @GetMapping("/user/{userId}/paged")
    @PreAuthorize("@userSecurity.isOwner(authentication, #userId)")
    public ResponseEntity<Page<DeckDto>> getDecksByUserPaged(@PathVariable Long userId, Pageable pageable) {
        return ResponseEntity.ok(deckService.getDecksByUserPaged(userId, pageable));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<DeckDto> createDeck(@Valid @RequestBody DeckCreateDto deckCreateDto) {
        // No es necesario obtener el usuario del token JWT, el servicio lo hará automáticamente
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

    @GetMapping("/{id}/update-color")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<DeckDto> updateDeckColor(@PathVariable Long id) {
        return ResponseEntity.ok(deckService.updateDeckColor(id));
    }
    
    @PostMapping("/user/{userId}/update-colors")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #userId)")
    public ResponseEntity<List<DeckDto>> updateUserDecksColors(@PathVariable Long userId) {
        log.info("Actualizando colores de todos los mazos del usuario {}", userId);
        List<DeckDto> decks = deckService.getDecksByUser(userId);
        List<DeckDto> updatedDecks = new ArrayList<>();
        
        for (DeckDto deck : decks) {
            // Verificar si el color es nulo o está vacío
            if (deck.getDeckColor() == null || deck.getDeckColor().isEmpty()) {
                updatedDecks.add(deckService.updateDeckColor(deck.getDeckId()));
            }
        }
        
        return ResponseEntity.ok(updatedDecks);
    }
}