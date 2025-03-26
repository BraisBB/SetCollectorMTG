package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.SetMtgDto;
import com.setcollectormtg.setcollectormtg.model.SetMtg;
import com.setcollectormtg.setcollectormtg.repository.SetMtgRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SetMtgServiceImpl implements SetMtgService {

    private final SetMtgRepository setMtgRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SetMtgDto> getAllSets() {
        return setMtgRepository.findAll().stream()
                .map(SetMtgDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SetMtgDto getSetById(Long id) {
        return setMtgRepository.findById(id)
                .map(SetMtgDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("Set not found with id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public SetMtgDto getSetByCode(String setCode) {
        return setMtgRepository.findBySetCode(setCode)
                .map(SetMtgDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("Set not found with code: " + setCode));
    }

    @Override
    public SetMtgDto createSet(SetMtgDto setMtgDto) {
        if (setMtgRepository.existsBySetCode(setMtgDto.getSetCode())) {
            throw new RuntimeException("Set with code " + setMtgDto.getSetCode() + " already exists");
        }

        SetMtg setMtg = new SetMtg();
        setMtg.setName(setMtgDto.getName());
        setMtg.setSetCode(setMtgDto.getSetCode());
        setMtg.setTotalCards(setMtgDto.getTotalCards());
        setMtg.setReleaseDate(setMtgDto.getReleaseDate());

        SetMtg savedSet = setMtgRepository.save(setMtg);
        return SetMtgDto.fromEntity(savedSet);
    }

    @Override
    public SetMtgDto updateSet(Long id, SetMtgDto setDetails) {
        SetMtg setMtg = setMtgRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Set not found with id: " + id));

        // Verificar si el nuevo código ya existe (si ha cambiado)
        if (!setMtg.getSetCode().equals(setDetails.getSetCode()) &&
                setMtgRepository.existsBySetCode(setDetails.getSetCode())) {
            throw new RuntimeException("Set code " + setDetails.getSetCode() + " already exists");
        }

        setMtg.setName(setDetails.getName());
        setMtg.setSetCode(setDetails.getSetCode());
        setMtg.setTotalCards(setDetails.getTotalCards());
        setMtg.setReleaseDate(setDetails.getReleaseDate());

        SetMtg updatedSet = setMtgRepository.save(setMtg);
        return SetMtgDto.fromEntity(updatedSet);
    }

    @Override
    public void deleteSet(Long id) {
        SetMtg setMtg = setMtgRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Set not found with id: " + id));

        // Opcional: Verificar si hay cartas asociadas antes de borrar
        if (!setMtg.getCards().isEmpty()) {
            throw new RuntimeException("Cannot delete set with id " + id + " because it has associated cards");
        }

        setMtgRepository.delete(setMtg);
    }
}