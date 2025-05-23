package com.setcollectormtg.setcollectormtg.mapper;

import com.setcollectormtg.setcollectormtg.dto.SetMtgCreateDto;
import com.setcollectormtg.setcollectormtg.dto.SetMtgDto;
import com.setcollectormtg.setcollectormtg.model.SetMtg;
import org.mapstruct.*;

@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface SetMtgMapper {

    @Mapping(target = "cards", ignore = true)
    @Mapping(source = "setCode", target = "setCode")
    SetMtg toEntity(SetMtgCreateDto setMtgCreateDto);

    @Mapping(target = "cards", ignore = true)
    @Mapping(source = "setCode", target = "setCode")
    SetMtgDto toDto(SetMtg setMtg);

    @Mapping(target = "setId", ignore = true)
    @Mapping(target = "cards", ignore = true)
    @Mapping(source = "setCode", target = "setCode")
    void updateSetFromDto(SetMtgCreateDto setMtgCreateDto, @MappingTarget SetMtg setMtg);
}