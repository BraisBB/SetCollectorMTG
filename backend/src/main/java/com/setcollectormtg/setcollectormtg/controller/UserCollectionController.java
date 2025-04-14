package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.UserCollectionDto;
import com.setcollectormtg.setcollectormtg.mapper.UserCollectionMapper;
import com.setcollectormtg.setcollectormtg.model.UserCollection;
import com.setcollectormtg.setcollectormtg.service.UserCollectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/collections")
@RequiredArgsConstructor
public class UserCollectionController {

    private final UserCollectionService userCollectionService;
    private final UserCollectionMapper userCollectionMapper; // Añadido el mapper

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<UserCollectionDto> createCollection(@RequestBody UserCollectionDto collectionDto) {
        UserCollection collection = userCollectionService.createCollection(
                userCollectionMapper.toEntity(collectionDto));
        return new ResponseEntity<>(userCollectionMapper.toDto(collection), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<UserCollectionDto> getCollectionById(@PathVariable Long id) {
        return ResponseEntity.ok(
                userCollectionMapper.toDto(userCollectionService.getCollectionById(id)));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('USER') and @userSecurity.isOwner(authentication, #userId)")
    public ResponseEntity<UserCollectionDto> getCollectionByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(
                userCollectionMapper.toDto(userCollectionService.getCollectionByUserId(userId)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<UserCollectionDto> updateCollection(
            @PathVariable Long id, @RequestBody UserCollectionDto collectionDto) {
        return ResponseEntity.ok(
                userCollectionMapper.toDto(
                        userCollectionService.updateCollection(id, userCollectionMapper.toEntity(collectionDto))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<Void> deleteCollection(@PathVariable Long id) {
        userCollectionService.deleteCollection(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/total-cards")
    @PreAuthorize("hasRole('USER') and @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<Integer> getTotalCardsInCollection(@PathVariable Long id) {
        return ResponseEntity.ok(userCollectionService.getTotalCardsInCollection(id));
    }
}