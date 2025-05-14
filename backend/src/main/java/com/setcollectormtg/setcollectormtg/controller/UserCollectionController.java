package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.UserCollectionDto;
import com.setcollectormtg.setcollectormtg.dto.UserCollectionCardDto;
import com.setcollectormtg.setcollectormtg.service.UserCollectionService;
import com.setcollectormtg.setcollectormtg.service.UserCollectionCardService;
import com.setcollectormtg.setcollectormtg.service.AuthService;
import com.setcollectormtg.setcollectormtg.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/collections")
@RequiredArgsConstructor
@Slf4j
public class UserCollectionController {

    private final UserCollectionService userCollectionService;
    private final UserCollectionCardService userCollectionCardService;
    private final AuthService authService;

    @PostMapping
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<UserCollectionDto> createCollection(@RequestBody UserCollectionDto collectionDto) {
        // Asegurar que la colección pertenece al usuario actual
        collectionDto.setUserId(authService.getCurrentUserId());
        
        UserCollectionDto created = userCollectionService.createCollection(collectionDto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<UserCollectionDto> getCollectionById(@PathVariable Long id) {
        log.debug("Obteniendo colección con ID: {}", id);
        return ResponseEntity.ok(userCollectionService.getCollectionById(id));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #userId)")
    public ResponseEntity<UserCollectionDto> getCollectionByUserId(@PathVariable Long userId) {
        log.debug("Obteniendo colección para usuario con ID: {}", userId);
        return ResponseEntity.ok(userCollectionService.getCollectionByUserId(userId));
    }

    @GetMapping("/user/current")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<UserCollectionDto> getCurrentUserCollection() {
        try {
            log.debug("Iniciando solicitud para obtener colección del usuario actual");
            User currentUser = authService.getCurrentUser();
            
            if (currentUser == null) {
                log.warn("No se pudo obtener el usuario actual");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            log.debug("Usuario obtenido con ID: {}", currentUser.getUserId());
            
            UserCollectionDto collection = userCollectionService.getCollectionByUserId(currentUser.getUserId());
            log.debug("Colección obtenida para usuario {}: {}", currentUser.getUserId(), 
                    collection != null ? collection.getCollectionId() : "nula");
                    
            return ResponseEntity.ok(collection);
        } catch (Exception e) {
            log.error("Error al obtener la colección del usuario actual", e);
            throw new RuntimeException("Error al obtener la colección: " + e.getMessage(), e);
        }
    }

    @GetMapping("/{id}/cards")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<List<UserCollectionCardDto>> getCollectionCards(@PathVariable Long id, Authentication authentication) {
        log.debug("Usuario {} solicitando cartas de la colección {}", 
                authentication != null ? authentication.getName() : "anónimo", id);
        List<UserCollectionCardDto> cards = userCollectionCardService.getCardsByCollectionId(id);
        return ResponseEntity.ok(cards);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<UserCollectionDto> updateCollection(
            @PathVariable Long id, @RequestBody UserCollectionDto collectionDto) {
        return ResponseEntity.ok(userCollectionService.updateCollection(id, collectionDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<Void> deleteCollection(@PathVariable Long id) {
        userCollectionService.deleteCollection(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/total-cards")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<Integer> getTotalCardsInCollection(@PathVariable Long id) {
        return ResponseEntity.ok(userCollectionService.getTotalCardsInCollection(id));
    }
}