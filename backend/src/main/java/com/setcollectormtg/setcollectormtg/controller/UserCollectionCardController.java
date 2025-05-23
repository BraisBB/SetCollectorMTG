package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.UserCollectionCardDto;
import com.setcollectormtg.setcollectormtg.dto.UserCollectionDto;
import com.setcollectormtg.setcollectormtg.service.UserCollectionCardService;
import com.setcollectormtg.setcollectormtg.service.UserCollectionService;
import com.setcollectormtg.setcollectormtg.util.CurrentUserUtil;
import com.setcollectormtg.setcollectormtg.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/collection/cards")
@RequiredArgsConstructor
public class UserCollectionCardController {

    private final UserCollectionCardService userCollectionCardService;
    private final UserCollectionService userCollectionService;
    private final CurrentUserUtil currentUserUtil;

    @PostMapping("/{cardId}")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER')")
    public ResponseEntity<UserCollectionCardDto> addCardToCollection(
            @PathVariable Long cardId,
            @RequestParam(defaultValue = "1") Integer quantity) {
        
        User user = currentUserUtil.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        UserCollectionDto userCollection = userCollectionService.getCollectionByUserId(user.getUserId());
        
        return new ResponseEntity<>(
            userCollectionCardService.addCardToCollection(userCollection.getCollectionId(), cardId, quantity),
            HttpStatus.CREATED);
    }

    @PutMapping("/{cardId}")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER')")
    public ResponseEntity<UserCollectionCardDto> updateCardQuantity(
            @PathVariable Long cardId,
            @RequestParam Integer quantity) {
        
        User user = currentUserUtil.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        UserCollectionDto userCollection = userCollectionService.getCollectionByUserId(user.getUserId());
        
        return ResponseEntity.ok(
            userCollectionCardService.updateCardQuantity(userCollection.getCollectionId(), cardId, quantity));
    }

    @DeleteMapping("/{cardId}")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER')")
    public ResponseEntity<Void> removeCardFromCollection(@PathVariable Long cardId) {
        
        User user = currentUserUtil.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        UserCollectionDto userCollection = userCollectionService.getCollectionByUserId(user.getUserId());
        
        userCollectionCardService.removeCardFromCollection(userCollection.getCollectionId(), cardId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{cardId}")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER')")
    public ResponseEntity<UserCollectionCardDto> getCardCollectionInfo(@PathVariable Long cardId) {
        
        User user = currentUserUtil.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        UserCollectionDto userCollection = userCollectionService.getCollectionByUserId(user.getUserId());
        
        return ResponseEntity.ok(
            userCollectionCardService.getCardCollectionInfo(userCollection.getCollectionId(), cardId));
    }

    @GetMapping("/{cardId}/quantity")
    @PreAuthorize("hasAnyAuthority('USER', 'ROLE_USER')")
    public ResponseEntity<Integer> getCardQuantity(@PathVariable Long cardId) {
        
        User user = currentUserUtil.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        UserCollectionDto userCollection = userCollectionService.getCollectionByUserId(user.getUserId());
        
        return ResponseEntity.ok(
            userCollectionCardService.getCardCountInCollection(userCollection.getCollectionId(), cardId));
    }
}