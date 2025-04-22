package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.SetMtgCreateDto;
import com.setcollectormtg.setcollectormtg.dto.SetMtgDto;
import com.setcollectormtg.setcollectormtg.dto.CardDto;
import java.util.List;

public interface SetMtgService {
    List<SetMtgDto> getAllSets();

    SetMtgDto getSetById(Long id);

    SetMtgDto getSetByCode(String setCode);

    SetMtgDto createSet(SetMtgCreateDto setMtgCreateDto);

    SetMtgDto updateSet(Long id, SetMtgCreateDto setDetails);

    void deleteSet(Long id);

    List<CardDto> getCardsBySet(Long setId);
}