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

    /**
     * Creates a new collection for the current user.
     * Requires USER authority only.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<UserCollectionDto> createCollection(@RequestBody UserCollectionDto collectionDto) {
        // Ensure the collection belongs to the current user
        Long currentUserId = currentUserUtil.getCurrentUserId();
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        collectionDto.setUserId(currentUserId);

        UserCollectionDto created = userCollectionService.createCollection(collectionDto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /**
     * Gets a collection by ID. Accessible by ADMIN (for moderation) or the
     * collection owner.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or (hasAuthority('USER') and @userSecurity.isOwner(authentication, #id))")
    public ResponseEntity<UserCollectionDto> getCollectionById(@PathVariable Long id) {
        log.debug("Getting collection with ID: {}", id);
        return ResponseEntity.ok(userCollectionService.getCollectionById(id));
    }

    /**
     * Gets a collection by user ID. Accessible by ADMIN (for moderation) or the
     * user themselves.
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('ADMIN') or (hasAuthority('USER') and @userSecurity.isOwner(authentication, #userId))")
    public ResponseEntity<UserCollectionDto> getCollectionByUserId(@PathVariable Long userId) {
        log.debug("Getting collection for user with ID: {}", userId);
        return ResponseEntity.ok(userCollectionService.getCollectionByUserId(userId));
    }

    /**
     * Gets the current authenticated user's collection.
     * Requires USER authority only.
     */
    @GetMapping("/user/current")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<UserCollectionDto> getCurrentUserCollection() {
        try {
            log.debug("Starting request to get current user's collection");
            User currentUser = currentUserUtil.getCurrentUser();

            if (currentUser == null) {
                log.warn("Could not get current user");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            log.debug("User obtained with ID: {}", currentUser.getUserId());

            // Get or create collection if it doesn't exist
            UserCollectionDto collection = userCollectionService.getOrCreateCollectionByUserId(currentUser.getUserId());
            log.debug("Collection obtained for user {}: {}", currentUser.getUserId(),
                    collection != null ? collection.getCollectionId() : "null");

            return ResponseEntity.ok(collection);
        } catch (Exception e) {
            log.error("Error getting current user's collection", e);
            throw new RuntimeException("Error getting collection: " + e.getMessage(), e);
        }
    }

    /**
     * Gets the current authenticated user's collection cards.
     * Requires USER authority only.
     */
    @GetMapping("/current-user/cards")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<List<UserCollectionCardDto>> getCurrentUserCollectionCards() {
        try {
            log.debug("Getting current user's collection cards");
            User currentUser = currentUserUtil.getCurrentUser();

            if (currentUser == null) {
                log.warn("Could not get current user");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Get or create collection if it doesn't exist
            UserCollectionDto collection = userCollectionService.getOrCreateCollectionByUserId(currentUser.getUserId());

            // Get collection cards
            List<UserCollectionCardDto> cards = userCollectionCardService
                    .getCardsByCollectionId(collection.getCollectionId());
            log.debug("Retrieved {} cards for user {}'s collection", cards.size(), currentUser.getUserId());

            return ResponseEntity.ok(cards);
        } catch (Exception e) {
            log.error("Error getting current user's collection cards", e);
            throw new RuntimeException("Error getting collection cards: " + e.getMessage(), e);
        }
    }

    /**
     * Gets cards from a specific collection. Accessible by ADMIN (for moderation)
     * or the collection owner.
     */
    @GetMapping("/{id}/cards")
    @PreAuthorize("hasAuthority('ADMIN') or (hasAuthority('USER') and @userSecurity.isOwner(authentication, #id))")
    public ResponseEntity<List<UserCollectionCardDto>> getCollectionCards(@PathVariable Long id,
            Authentication authentication) {
        log.debug("User {} requesting cards from collection {}",
                authentication != null ? authentication.getName() : "anonymous", id);
        List<UserCollectionCardDto> cards = userCollectionCardService.getCardsByCollectionId(id);
        return ResponseEntity.ok(cards);
    }

    /**
     * Updates a collection. Accessible by the collection owner only.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<UserCollectionDto> updateCollection(
            @PathVariable Long id, @RequestBody UserCollectionDto collectionDto) {
        return ResponseEntity.ok(userCollectionService.updateCollection(id, collectionDto));
    }

    /**
     * Deletes a collection. Accessible by ADMIN (for moderation) or the collection
     * owner.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or (hasAuthority('USER') and @userSecurity.isOwner(authentication, #id))")
    public ResponseEntity<Void> deleteCollection(@PathVariable Long id) {
        userCollectionService.deleteCollection(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Gets total number of cards in a collection. Accessible by ADMIN (for
     * moderation) or the collection owner.
     */
    @GetMapping("/{id}/total-cards")
    @PreAuthorize("hasAuthority('ADMIN') or (hasAuthority('USER') and @userSecurity.isOwner(authentication, #id))")
    public ResponseEntity<Integer> getTotalCardsInCollection(@PathVariable Long id) {
        return ResponseEntity.ok(userCollectionService.getTotalCardsInCollection(id));
    }
}