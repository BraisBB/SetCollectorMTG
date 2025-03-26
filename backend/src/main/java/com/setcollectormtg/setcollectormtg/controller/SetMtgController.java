package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.SetMtgDto;
import com.setcollectormtg.setcollectormtg.service.SetMtgService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sets")
@RequiredArgsConstructor
public class SetMtgController {

    private final SetMtgService setMtgService;

    @GetMapping
    public ResponseEntity<List<SetMtgDto>> getAllSets() {
        return ResponseEntity.ok(setMtgService.getAllSets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SetMtgDto> getSetById(@PathVariable Long id) {
        return ResponseEntity.ok(setMtgService.getSetById(id));
    }

    @GetMapping("/code/{setCode}")
    public ResponseEntity<SetMtgDto> getSetByCode(@PathVariable String setCode) {
        return ResponseEntity.ok(setMtgService.getSetByCode(setCode));
    }

    @PostMapping
    public ResponseEntity<SetMtgDto> createSet(@RequestBody SetMtgDto setMtgDto) {
        return new ResponseEntity<>(setMtgService.createSet(setMtgDto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SetMtgDto> updateSet(@PathVariable Long id, @RequestBody SetMtgDto setMtgDto) {
        return ResponseEntity.ok(setMtgService.updateSet(id, setMtgDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSet(@PathVariable Long id) {
        setMtgService.deleteSet(id);
        return ResponseEntity.noContent().build();
    }
}