package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.model.SetMtg;
import java.util.List;

public interface SetMtgService {
    List<SetMtg> getAllSets();
    SetMtg getSetById(Long id);
    SetMtg getSetByCode(String setCode);
    SetMtg createSet(SetMtg setMtg);
    SetMtg updateSet(Long id, SetMtg setMtg);
    void deleteSet(Long id);
}