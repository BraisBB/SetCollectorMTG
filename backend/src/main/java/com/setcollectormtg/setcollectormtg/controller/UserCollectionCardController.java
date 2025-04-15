package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.UserCollectionCardDto;
import com.setcollectormtg.setcollectormtg.service.UserCollectionCardService;
import com.setcollectormtg.setcollectormtg.service.UserCollectionService;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import com.setcollectormtg.setcollectormtg.model.UserCollection;
import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/collection/cards")
@RequiredArgsConstructor
public class UserCollectionCardController {

    private final UserCollectionCardService userCollectionCardService;
    private final UserCollectionService userCollectionService;
    private final UserRepository userRepository;

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @PostMapping("/{cardId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<UserCollectionCardDto> addCardToCollection(
            Authentication authentication,
            @PathVariable Long cardId,
            @RequestParam(defaultValue = "1") Integer quantity) {
        
        User user = getCurrentUser(authentication);
        UserCollection userCollection = userCollectionService.getCollectionByUserId(user.getUserId());
        
        return new ResponseEntity<>(
            userCollectionCardService.addCardToCollection(userCollection.getCollectionId(), cardId, quantity),
            HttpStatus.CREATED);
    }

    @PutMapping("/{cardId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<UserCollectionCardDto> updateCardQuantity(
            Authentication authentication,
            @PathVariable Long cardId,
            @RequestParam Integer quantity) {
        
        User user = getCurrentUser(authentication);
        UserCollection userCollection = userCollectionService.getCollectionByUserId(user.getUserId());
        
        return ResponseEntity.ok(
            userCollectionCardService.updateCardQuantity(userCollection.getCollectionId(), cardId, quantity));
    }

    @DeleteMapping("/{cardId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Void> removeCardFromCollection(
            Authentication authentication,
            @PathVariable Long cardId) {
        
        User user = getCurrentUser(authentication);
        UserCollection userCollection = userCollectionService.getCollectionByUserId(user.getUserId());
        
        userCollectionCardService.removeCardFromCollection(userCollection.getCollectionId(), cardId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{cardId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<UserCollectionCardDto> getCardCollectionInfo(
            Authentication authentication,
            @PathVariable Long cardId) {
        
        User user = getCurrentUser(authentication);
        UserCollection userCollection = userCollectionService.getCollectionByUserId(user.getUserId());
        
        return ResponseEntity.ok(
            userCollectionCardService.getCardCollectionInfo(userCollection.getCollectionId(), cardId));
    }

    @GetMapping("/{cardId}/quantity")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Integer> getCardQuantity(
            Authentication authentication,
            @PathVariable Long cardId) {
        
        User user = getCurrentUser(authentication);
        UserCollection userCollection = userCollectionService.getCollectionByUserId(user.getUserId());
        
        return ResponseEntity.ok(
            userCollectionCardService.getCardCountInCollection(userCollection.getCollectionId(), cardId));
    }
}