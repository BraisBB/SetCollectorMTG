package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.UserCollectionDto;
import com.setcollectormtg.setcollectormtg.dto.UserCollectionCardDto;
import com.setcollectormtg.setcollectormtg.service.UserCollectionService;
import com.setcollectormtg.setcollectormtg.service.UserCollectionCardService;
import com.setcollectormtg.setcollectormtg.service.UserService;
import com.setcollectormtg.setcollectormtg.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/collections")
@RequiredArgsConstructor
public class UserCollectionController {

    private final UserCollectionService userCollectionService;
    private final UserCollectionCardService userCollectionCardService;
    private final UserService userService;

    private User getCurrentUser(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        User syncedUser = userService.synchronizeUser(jwt);
        return syncedUser;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<UserCollectionDto> createCollection(@RequestBody UserCollectionDto collectionDto) {
        UserCollectionDto created = userCollectionService.createCollection(collectionDto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<UserCollectionDto> getCollectionById(@PathVariable Long id) {
        return ResponseEntity.ok(userCollectionService.getCollectionById(id));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #userId)")
    public ResponseEntity<UserCollectionDto> getCollectionByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(userCollectionService.getCollectionByUserId(userId));
    }

    @GetMapping("/user/current")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<UserCollectionDto> getCurrentUserCollection(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.ok(userCollectionService.getCollectionByUserId(user.getUserId()));
    }

    @GetMapping("/{id}/cards")
    @PreAuthorize("hasAuthority('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<List<UserCollectionCardDto>> getCollectionCards(@PathVariable Long id) {
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