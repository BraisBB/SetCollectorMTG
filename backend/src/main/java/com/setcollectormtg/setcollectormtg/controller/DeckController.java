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

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<DeckDto>> getAllDecks() {
        return ResponseEntity.ok(deckService.getAllDecks());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER', 'ADMIN', 'ROLE_ADMIN') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<DeckDto> getDeckById(@PathVariable Long id) {
        return ResponseEntity.ok(deckService.getDeckById(id));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER', 'ADMIN', 'ROLE_ADMIN') and @userSecurity.isOwner(authentication, #userId)")
    public ResponseEntity<List<DeckDto>> getDecksByUser(@PathVariable Long userId) {
        log.info("Solicitando mazos para usuario con ID: {}", userId);
        return ResponseEntity.ok(deckService.getDecksByUser(userId));
    }

    @GetMapping("/user/byUsername/{username}")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER', 'ADMIN', 'ROLE_ADMIN') and @userSecurity.canAccessUserByUsername(authentication, #username)")
    public ResponseEntity<List<DeckDto>> getDecksByUsername(@PathVariable String username) {
        log.info("Solicitando mazos para usuario con username: {}", username);
        return ResponseEntity.ok(deckService.getDecksByUsername(username));
    }
    
    @GetMapping("/current-user")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER', 'ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<DeckDto>> getDecksForCurrentUser() {
        log.info("Solicitando mazos para el usuario autenticado actualmente");
        
        User currentUser = currentUserUtil.getCurrentUser();
        if (currentUser == null) {
            log.warn("No se pudo obtener el usuario actual");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        log.info("Usuario autenticado con ID: {}, username: {}", 
                currentUser.getUserId(), currentUser.getUsername());
        
        return ResponseEntity.ok(deckService.getDecksByUser(currentUser.getUserId()));
    }

    @GetMapping("/user/{userId}/paged")
    @PreAuthorize("@userSecurity.isOwner(authentication, #userId)")
    public ResponseEntity<Page<DeckDto>> getDecksByUserPaged(@PathVariable Long userId, Pageable pageable) {
        return ResponseEntity.ok(deckService.getDecksByUserPaged(userId, pageable));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER', 'ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<DeckDto> createDeck(@Valid @RequestBody DeckCreateDto deckCreateDto) {
        try {
            log.info("Solicitud de creación de mazo recibida: {}", deckCreateDto);
            
            // Validar explícitamente que el DTO es correcto
            if (deckCreateDto.getDeckName() == null || deckCreateDto.getDeckName().trim().isEmpty()) {
                log.warn("Intento de crear mazo con nombre vacío");
                return ResponseEntity.badRequest().build();
            }
            
            // Crear el mazo
            DeckDto createdDeck = deckService.createDeck(deckCreateDto);
            log.info("Mazo creado exitosamente con ID: {}", createdDeck.getDeckId());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(createdDeck);
        } catch (Exception e) {
            log.error("Error al crear mazo: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER', 'ADMIN', 'ROLE_ADMIN') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<DeckDto> updateDeck(
            @PathVariable Long id,
            @Valid @RequestBody DeckDto deckDto) {
        return ResponseEntity.ok(deckService.updateDeck(id, deckDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("(hasAnyAuthority('USER', 'ROLE_USER') and @userSecurity.isOwner(authentication, #id)) or hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Void> deleteDeck(@PathVariable Long id) {
        deckService.deleteDeck(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/update-color")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER', 'ADMIN', 'ROLE_ADMIN') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<DeckDto> updateDeckColor(@PathVariable Long id) {
        return ResponseEntity.ok(deckService.updateDeckColor(id));
    }
}