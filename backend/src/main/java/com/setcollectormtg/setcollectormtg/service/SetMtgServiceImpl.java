package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.model.SetMtg;
import com.setcollectormtg.setcollectormtg.repository.SetMtgRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SetMtgServiceImpl implements SetMtgService {

    private final SetMtgRepository setMtgRepository;

    @Override
    public List<SetMtg> getAllSets() {
        return setMtgRepository.findAll();
    }

    @Override
    public SetMtg getSetById(Long id) {
        return setMtgRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Set not found with id: " + id));
    }

    @Override
    public SetMtg getSetByCode(String setCode) {
        return setMtgRepository.findBySetCode(setCode)
                .orElseThrow(() -> new RuntimeException("Set not found with code: " + setCode));
    }

    @Override
    public SetMtg createSet(SetMtg setMtg) {
        if (setMtgRepository.existsBySetCode(setMtg.getSetCode())) {
            throw new RuntimeException("Set with code " + setMtg.getSetCode() + " already exists");
        }
        return setMtgRepository.save(setMtg);
    }

    @Override
    public SetMtg updateSet(Long id, SetMtg setDetails) {
        SetMtg setMtg = getSetById(id);

        // Verificar si el nuevo código ya existe (si ha cambiado)
        if (!setMtg.getSetCode().equals(setDetails.getSetCode()) &&
                setMtgRepository.existsBySetCode(setDetails.getSetCode())) {
            throw new RuntimeException("Set code " + setDetails.getSetCode() + " already exists");
        }

        setMtg.setName(setDetails.getName());
        setMtg.setSetCode(setDetails.getSetCode());
        setMtg.setTotalCards(setDetails.getTotalCards());
        setMtg.setReleaseDate(setDetails.getReleaseDate());

        return setMtgRepository.save(setMtg);
    }

    @Override
    public void deleteSet(Long id) {
        SetMtg setMtg = getSetById(id);
        // Verificar si hay cartas asociadas antes de borrar?
        setMtgRepository.delete(setMtg);
    }
}