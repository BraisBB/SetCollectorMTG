package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.model.SetMtg;
import com.setcollectormtg.setcollectormtg.service.SetMtgService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sets")
@RequiredArgsConstructor
public class SetMtgController {

    private final SetMtgService setMtgService;

    @GetMapping
    public ResponseEntity<List<SetMtg>> getAllSets() {
        return ResponseEntity.ok(setMtgService.getAllSets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SetMtg> getSetById(@PathVariable Long id) {
        return ResponseEntity.ok(setMtgService.getSetById(id));
    }

    @GetMapping("/code/{setCode}")
    public ResponseEntity<SetMtg> getSetByCode(@PathVariable String setCode) {
        return ResponseEntity.ok(setMtgService.getSetByCode(setCode));
    }

    @PostMapping
    public ResponseEntity<SetMtg> createSet(@RequestBody SetMtg setMtg) {
        return ResponseEntity.ok(setMtgService.createSet(setMtg));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SetMtg> updateSet(@PathVariable Long id, @RequestBody SetMtg setMtg) {
        return ResponseEntity.ok(setMtgService.updateSet(id, setMtg));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSet(@PathVariable Long id) {
        setMtgService.deleteSet(id);
        return ResponseEntity.noContent().build();
    }
}