package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.UserCollectionCardDto;
import com.setcollectormtg.setcollectormtg.dto.UserCollectionDto;
import com.setcollectormtg.setcollectormtg.service.UserCollectionCardService;
import com.setcollectormtg.setcollectormtg.service.UserCollectionService;
import com.setcollectormtg.setcollectormtg.util.CurrentUserUtil;
import com.setcollectormtg.setcollectormtg.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/collection/cards")
@RequiredArgsConstructor
@Slf4j
public class UserCollectionCardController {

    private final UserCollectionCardService userCollectionCardService;
    private final UserCollectionService userCollectionService;
    private final CurrentUserUtil currentUserUtil;

    /**
     * Adds a card to the current user's collection. USER authority only.
     */
    @PostMapping("/{cardId}")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<UserCollectionCardDto> addCardToCollection(
            @PathVariable Long cardId,
            @RequestParam(defaultValue = "1") Integer quantity) {

        log.debug("Adding card {} to user collection with quantity {}", cardId, quantity);

        User user = currentUserUtil.getCurrentUser();
        if (user == null) {
            log.warn("Could not get current user");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserCollectionDto userCollection = userCollectionService.getCollectionByUserId(user.getUserId());

        return new ResponseEntity<>(
                userCollectionCardService.addCardToCollection(userCollection.getCollectionId(), cardId, quantity),
                HttpStatus.CREATED);
    }

    /**
     * Updates the quantity of a card in the current user's collection. USER
     * authority only.
     */
    @PutMapping("/{cardId}")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<UserCollectionCardDto> updateCardQuantity(
            @PathVariable Long cardId,
            @RequestParam Integer quantity) {

        log.debug("Updating card {} quantity to {} in user collection", cardId, quantity);

        User user = currentUserUtil.getCurrentUser();
        if (user == null) {
            log.warn("Could not get current user");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserCollectionDto userCollection = userCollectionService.getCollectionByUserId(user.getUserId());

        return ResponseEntity.ok(
                userCollectionCardService.updateCardQuantity(userCollection.getCollectionId(), cardId, quantity));
    }

    /**
     * Removes a card from the current user's collection. USER authority only.
     */
    @DeleteMapping("/{cardId}")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<Void> removeCardFromCollection(@PathVariable Long cardId) {

        log.debug("Removing card {} from user collection", cardId);

        User user = currentUserUtil.getCurrentUser();
        if (user == null) {
            log.warn("Could not get current user");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserCollectionDto userCollection = userCollectionService.getCollectionByUserId(user.getUserId());

        userCollectionCardService.removeCardFromCollection(userCollection.getCollectionId(), cardId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Gets information about a specific card in the current user's collection. USER
     * authority only.
     */
    @GetMapping("/{cardId}")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<UserCollectionCardDto> getCardCollectionInfo(@PathVariable Long cardId) {

        log.debug("Getting card {} info from user collection", cardId);

        User user = currentUserUtil.getCurrentUser();
        if (user == null) {
            log.warn("Could not get current user");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserCollectionDto userCollection = userCollectionService.getCollectionByUserId(user.getUserId());

        return ResponseEntity.ok(
                userCollectionCardService.getCardCollectionInfo(userCollection.getCollectionId(), cardId));
    }

    /**
     * Gets the quantity of a specific card in the current user's collection. USER
     * authority only.
     */
    @GetMapping("/{cardId}/quantity")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<Integer> getCardQuantity(@PathVariable Long cardId) {

        log.debug("Getting card {} quantity from user collection", cardId);

        User user = currentUserUtil.getCurrentUser();
        if (user == null) {
            log.warn("Could not get current user");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserCollectionDto userCollection = userCollectionService.getCollectionByUserId(user.getUserId());

        return ResponseEntity.ok(
                userCollectionCardService.getCardCountInCollection(userCollection.getCollectionId(), cardId));
    }
}