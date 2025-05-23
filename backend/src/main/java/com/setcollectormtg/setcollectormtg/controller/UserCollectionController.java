package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.UserCollectionDto;
import com.setcollectormtg.setcollectormtg.dto.UserCollectionCardDto;
import com.setcollectormtg.setcollectormtg.service.UserCollectionService;
import com.setcollectormtg.setcollectormtg.service.UserCollectionCardService;
import com.setcollectormtg.setcollectormtg.util.CurrentUserUtil;
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
    private final CurrentUserUtil currentUserUtil;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER')")
    public ResponseEntity<UserCollectionDto> createCollection(@RequestBody UserCollectionDto collectionDto) {
                // Asegurar que la colección pertenece al usuario actual        Long currentUserId = currentUserUtil.getCurrentUserId();        if (currentUserId == null) {            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();        }        collectionDto.setUserId(currentUserId);
        
        UserCollectionDto created = userCollectionService.createCollection(collectionDto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER', 'ADMIN', 'ROLE_ADMIN') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<UserCollectionDto> getCollectionById(@PathVariable Long id) {
        log.debug("Obteniendo colección con ID: {}", id);
        return ResponseEntity.ok(userCollectionService.getCollectionById(id));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER', 'ADMIN', 'ROLE_ADMIN') and @userSecurity.isOwner(authentication, #userId)")
    public ResponseEntity<UserCollectionDto> getCollectionByUserId(@PathVariable Long userId) {
        log.debug("Obteniendo colección para usuario con ID: {}", userId);
        return ResponseEntity.ok(userCollectionService.getCollectionByUserId(userId));
    }

    @GetMapping("/user/current")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER')")
    public ResponseEntity<UserCollectionDto> getCurrentUserCollection() {
        try {
            log.debug("Iniciando solicitud para obtener colección del usuario actual");
            User currentUser = currentUserUtil.getCurrentUser();
            
            if (currentUser == null) {
                log.warn("No se pudo obtener el usuario actual");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            log.debug("Usuario obtenido con ID: {}", currentUser.getUserId());
            
            // Obtener o crear la colección si no existe
            UserCollectionDto collection = userCollectionService.getOrCreateCollectionByUserId(currentUser.getUserId());
            log.debug("Colección obtenida para usuario {}: {}", currentUser.getUserId(), 
                    collection != null ? collection.getCollectionId() : "nula");
                    
            return ResponseEntity.ok(collection);
        } catch (Exception e) {
            log.error("Error al obtener la colección del usuario actual", e);
            throw new RuntimeException("Error al obtener la colección: " + e.getMessage(), e);
        }
    }

    @GetMapping("/current-user/cards")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER')")
    public ResponseEntity<List<UserCollectionCardDto>> getCurrentUserCollectionCards() {
        try {
            log.debug("Obteniendo cartas de la colección del usuario actual");
            User currentUser = currentUserUtil.getCurrentUser();
            
            if (currentUser == null) {
                log.warn("No se pudo obtener el usuario actual");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            // Obtener o crear la colección si no existe
            UserCollectionDto collection = userCollectionService.getOrCreateCollectionByUserId(currentUser.getUserId());
            
            // Obtener las cartas de la colección
            List<UserCollectionCardDto> cards = userCollectionCardService.getCardsByCollectionId(collection.getCollectionId());
            log.debug("Obtenidas {} cartas para la colección del usuario {}", cards.size(), currentUser.getUserId());
            
            return ResponseEntity.ok(cards);
        } catch (Exception e) {
            log.error("Error al obtener las cartas de la colección del usuario actual", e);
            throw new RuntimeException("Error al obtener las cartas de la colección: " + e.getMessage(), e);
        }
    }

    @GetMapping("/{id}/cards")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER', 'ADMIN', 'ROLE_ADMIN') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<List<UserCollectionCardDto>> getCollectionCards(@PathVariable Long id, Authentication authentication) {
        log.debug("Usuario {} solicitando cartas de la colección {}", 
                authentication != null ? authentication.getName() : "anónimo", id);
        List<UserCollectionCardDto> cards = userCollectionCardService.getCardsByCollectionId(id);
        return ResponseEntity.ok(cards);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<UserCollectionDto> updateCollection(
            @PathVariable Long id, @RequestBody UserCollectionDto collectionDto) {
        return ResponseEntity.ok(userCollectionService.updateCollection(id, collectionDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER', 'ADMIN', 'ROLE_ADMIN') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<Void> deleteCollection(@PathVariable Long id) {
        userCollectionService.deleteCollection(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/total-cards")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER', 'ADMIN', 'ROLE_ADMIN') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<Integer> getTotalCardsInCollection(@PathVariable Long id) {
        return ResponseEntity.ok(userCollectionService.getTotalCardsInCollection(id));
    }
}