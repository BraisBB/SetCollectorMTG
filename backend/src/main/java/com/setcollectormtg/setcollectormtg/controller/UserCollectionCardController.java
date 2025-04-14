package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.UserCollectionCardDto;
import com.setcollectormtg.setcollectormtg.service.UserCollectionCardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/collections/{collectionId}/cards")
@RequiredArgsConstructor
public class UserCollectionCardController {

    private final UserCollectionCardService userCollectionCardService;

    @PostMapping("/{cardId}")
    @PreAuthorize("hasRole('USER') and @userSecurity.isOwner(authentication, #collectionId)")
    public ResponseEntity<UserCollectionCardDto> addCardToCollection(
            @PathVariable Long collectionId,
            @PathVariable Long cardId,
            @RequestParam(defaultValue = "1") Integer quantity) {
        return new ResponseEntity<>(
                userCollectionCardService.addCardToCollection(collectionId, cardId, quantity),
                HttpStatus.CREATED);
    }

    @PutMapping("/{cardId}")
    @PreAuthorize("hasRole('USER') and @userSecurity.isOwner(authentication, #collectionId)")
    public ResponseEntity<UserCollectionCardDto> updateCardQuantity(
            @PathVariable Long collectionId,
            @PathVariable Long cardId,
            @RequestParam Integer quantity) {
        return ResponseEntity.ok(
                userCollectionCardService.updateCardQuantity(collectionId, cardId, quantity));
    }

    @DeleteMapping("/{cardId}")
    @PreAuthorize("hasRole('USER') and @userSecurity.isOwner(authentication, #collectionId)")
    public ResponseEntity<Void> removeCardFromCollection(
            @PathVariable Long collectionId,
            @PathVariable Long cardId) {
        userCollectionCardService.removeCardFromCollection(collectionId, cardId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{cardId}")
    @PreAuthorize("hasRole('USER') and @userSecurity.isOwner(authentication, #collectionId)")
    public ResponseEntity<UserCollectionCardDto> getCardCollectionInfo(
            @PathVariable Long collectionId,
            @PathVariable Long cardId) {
        return ResponseEntity.ok(
                userCollectionCardService.getCardCollectionInfo(collectionId, cardId));
    }

    @GetMapping("/{cardId}/quantity")
    @PreAuthorize("hasRole('USER') and @userSecurity.isOwner(authentication, #collectionId)")
    public ResponseEntity<Integer> getCardQuantity(
            @PathVariable Long collectionId,
            @PathVariable Long cardId) {
        return ResponseEntity.ok(
                userCollectionCardService.getCardCountInCollection(collectionId, cardId));
    }
}