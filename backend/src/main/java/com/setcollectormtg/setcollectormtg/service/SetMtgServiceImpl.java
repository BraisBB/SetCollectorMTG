package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.SetMtgCreateDto;
import com.setcollectormtg.setcollectormtg.dto.SetMtgDto;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.mapper.SetMtgMapper;
import com.setcollectormtg.setcollectormtg.model.SetMtg;
import com.setcollectormtg.setcollectormtg.repository.SetMtgRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SetMtgServiceImpl implements SetMtgService {

    private final SetMtgRepository setMtgRepository;
    private final SetMtgMapper setMtgMapper;

    @Override
    @Transactional(readOnly = true)
    public List<SetMtgDto> getAllSets() {
        return setMtgRepository.findAll().stream()
                .map(setMtgMapper::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SetMtgDto getSetById(Long id) {
        return setMtgRepository.findById(id)
                .map(setMtgMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Set not found with id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public SetMtgDto getSetByCode(String setCode) {
        return setMtgRepository.findBySetCode(setCode)
                .map(setMtgMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Set not found with code: " + setCode));
    }

    @Override
    public SetMtgDto createSet(SetMtgCreateDto setMtgCreateDto) {
        if (setMtgRepository.existsBySetCode(setMtgCreateDto.getSetCode())) {
            throw new IllegalArgumentException("Set with code " + setMtgCreateDto.getSetCode() + " already exists");
        }

        SetMtg setMtg = setMtgMapper.toEntity(setMtgCreateDto);
        SetMtg savedSet = setMtgRepository.save(setMtg);
        return setMtgMapper.toDto(savedSet);
    }

    @Override
    public SetMtgDto updateSet(Long id, SetMtgCreateDto setDetails) {
        SetMtg setMtg = setMtgRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Set not found with id: " + id));

        if (!setMtg.getSetCode().equals(setDetails.getSetCode()) &&
                setMtgRepository.existsBySetCode(setDetails.getSetCode())) {
            throw new IllegalArgumentException("Set code " + setDetails.getSetCode() + " already exists");
        }

        setMtgMapper.updateSetFromDto(setDetails, setMtg);
        SetMtg updatedSet = setMtgRepository.save(setMtg);
        return setMtgMapper.toDto(updatedSet);
    }

    @Override
    public void deleteSet(Long id) {
        SetMtg setMtg = setMtgRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Set not found with id: " + id));

        if (!setMtg.getCards().isEmpty()) {
            throw new IllegalStateException("Cannot delete set with id " + id + " because it has associated cards");
        }

        setMtgRepository.delete(setMtg);
    }
}