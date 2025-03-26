package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.SetMtgDto;
import com.setcollectormtg.setcollectormtg.model.SetMtg;
import java.util.List;

public interface SetMtgService {
    List<SetMtgDto> getAllSets();
    SetMtgDto getSetById(Long id);
    SetMtgDto getSetByCode(String setCode);
    SetMtgDto createSet(SetMtgDto setMtgDto);
    SetMtgDto updateSet(Long id, SetMtgDto setDetails);
    void deleteSet(Long id);
}