package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.CardDto;
import com.setcollectormtg.setcollectormtg.dto.SetMtgCreateDto;
import com.setcollectormtg.setcollectormtg.dto.SetMtgDto;
import com.setcollectormtg.setcollectormtg.service.SetMtgService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sets")
@RequiredArgsConstructor
@Slf4j
public class SetMtgController {

    private final SetMtgService setMtgService;

    /**
     * Gets all MTG sets. This endpoint is public.
     */
    @GetMapping
    public ResponseEntity<List<SetMtgDto>> getAllSets() {
        log.debug("Getting all MTG sets");
        return ResponseEntity.ok(setMtgService.getAllSets());
    }

    /**
     * Gets an MTG set by ID. This endpoint is public.
     */
    @GetMapping("/{id}")
    public ResponseEntity<SetMtgDto> getSetById(@PathVariable Long id) {
        log.debug("Getting MTG set with ID: {}", id);
        return ResponseEntity.ok(setMtgService.getSetById(id));
    }

    /**
     * Gets an MTG set by set code. This endpoint is public.
     */
    @GetMapping("/code/{setCode}")
    public ResponseEntity<SetMtgDto> getSetByCode(@PathVariable String setCode) {
        log.debug("Getting MTG set with code: {}", setCode);
        return ResponseEntity.ok(setMtgService.getSetByCode(setCode));
    }

    /**
     * Creates a new MTG set. Requires ADMIN authority.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<SetMtgDto> createSet(@RequestBody SetMtgCreateDto setMtgCreateDto) {
        log.debug("Creating new MTG set: {}", setMtgCreateDto.getName());
        return new ResponseEntity<>(setMtgService.createSet(setMtgCreateDto), HttpStatus.CREATED);
    }

    /**
     * Updates an existing MTG set. Requires ADMIN authority.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<SetMtgDto> updateSet(@PathVariable Long id, @RequestBody SetMtgCreateDto setMtgCreateDto) {
        log.debug("Updating MTG set with ID: {}", id);
        return ResponseEntity.ok(setMtgService.updateSet(id, setMtgCreateDto));
    }

    /**
     * Deletes an MTG set. Requires ADMIN authority.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteSet(@PathVariable Long id) {
        log.debug("Deleting MTG set with ID: {}", id);
        setMtgService.deleteSet(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Gets all cards in an MTG set. This endpoint is public.
     */
    @GetMapping("/{id}/cards")
    public ResponseEntity<List<CardDto>> getCardsBySet(@PathVariable Long id) {
        log.debug("Getting cards for MTG set with ID: {}", id);
        return ResponseEntity.ok(setMtgService.getCardsBySet(id));
    }
}