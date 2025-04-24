package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.SetMtgCreateDto;
import com.setcollectormtg.setcollectormtg.dto.SetMtgDto;
import com.setcollectormtg.setcollectormtg.dto.CardDto;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.mapper.SetMtgMapper;
import com.setcollectormtg.setcollectormtg.mapper.CardMapper;
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
    private final CardMapper cardMapper;

    /**
     * Obtiene todos los sets registrados en la base de datos.
     *
     * @return Lista de sets en formato DTO
     */
    @Override
    @Transactional(readOnly = true)
    public List<SetMtgDto> getAllSets() {
        return setMtgRepository.findAll().stream()
                .map(setMtgMapper::toDto)
                .toList();
    }

    /**
     * Obtiene un set por su ID.
     * Lanza excepción si no existe.
     *
     * @param id ID del set
     * @return DTO del set encontrado
     */
    @Override
    @Transactional(readOnly = true)
    public SetMtgDto getSetById(Long id) {
        return setMtgRepository.findById(id)
                .map(setMtgMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Set not found with id: " + id));
    }

    /**
     * Obtiene un set por su código único.
     * Lanza excepción si no existe.
     *
     * @param setCode Código del set
     * @return DTO del set encontrado
     */
    @Override
    @Transactional(readOnly = true)
    public SetMtgDto getSetByCode(String setCode) {
        return setMtgRepository.findBySetCode(setCode)
                .map(setMtgMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Set not found with code: " + setCode));
    }

    /**
     * Crea un nuevo set, validando que el código no exista previamente.
     * Lanza excepción si el código ya está en uso.
     *
     * @param setMtgCreateDto DTO con los datos del set a crear
     * @return DTO del set creado
     */
    @Override
    public SetMtgDto createSet(SetMtgCreateDto setMtgCreateDto) {
        if (setMtgRepository.existsBySetCode(setMtgCreateDto.getSetCode())) {
            throw new IllegalArgumentException("Set with code " + setMtgCreateDto.getSetCode() + " already exists");
        }

        SetMtg setMtg = setMtgMapper.toEntity(setMtgCreateDto);
        SetMtg savedSet = setMtgRepository.save(setMtg);
        return setMtgMapper.toDto(savedSet);
    }

    /**
     * Actualiza los datos de un set, validando que el nuevo código no esté repetido.
     * Lanza excepción si el código ya está en uso por otro set.
     *
     * @param id         ID del set a actualizar
     * @param setDetails DTO con los nuevos datos del set
     * @return DTO actualizado del set
     */
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

    /**
     * Elimina un set si no contiene cartas asociadas.
     * Lanza excepción si el set tiene cartas.
     *
     * @param id ID del set a eliminar
     */
    @Override
    public void deleteSet(Long id) {
        SetMtg setMtg = setMtgRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Set not found with id: " + id));

        if (!setMtg.getCards().isEmpty()) {
            throw new IllegalStateException("Cannot delete set with id " + id + " because it has associated cards");
        }

        setMtgRepository.delete(setMtg);
    }

    /**
     * Obtiene todas las cartas asociadas a un set por su ID.
     * Lanza excepción si el set no existe.
     *
     * @param setId ID del set
     * @return Lista de cartas en formato DTO
     */
    @Override
    @Transactional(readOnly = true)
    public List<CardDto> getCardsBySet(Long setId) {
        SetMtg setMtg = setMtgRepository.findById(setId)
                .orElseThrow(() -> new ResourceNotFoundException("Set not found with id: " + setId));

        return setMtg.getCards().stream()
                .map(cardMapper::toDto)
                .toList();
    }
}