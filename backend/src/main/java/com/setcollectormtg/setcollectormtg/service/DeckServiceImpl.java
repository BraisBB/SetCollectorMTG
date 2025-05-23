package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.DeckCreateDto;
import com.setcollectormtg.setcollectormtg.dto.DeckDto;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.mapper.DeckMapper;
import com.setcollectormtg.setcollectormtg.model.Deck;
import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.model.CardDeck;
import com.setcollectormtg.setcollectormtg.repository.DeckRepository;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import com.setcollectormtg.setcollectormtg.repository.CardDeckRepository;
import com.setcollectormtg.setcollectormtg.util.CurrentUserUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeckServiceImpl implements DeckService {

    private final DeckRepository deckRepository;
    private final UserRepository userRepository;
    private final CardDeckRepository cardDeckRepository;
    private final DeckMapper deckMapper;
    private final CurrentUserUtil currentUserUtil;

    @Override
    @Transactional(readOnly = true)
    public List<DeckDto> getAllDecks() {
        return deckRepository.findAll().stream()
                .map(deckMapper::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DeckDto getDeckById(Long id) {
        return deckRepository.findById(id)
                .map(deckMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + id));
    }

    @Override
    @Transactional
    public DeckDto createDeck(DeckCreateDto deckCreateDto) {
        log.debug("Iniciando proceso de creación de mazo: {}", deckCreateDto);

        // Obtener el usuario autenticado
        User currentUser = currentUserUtil.getCurrentUser();
        if (currentUser == null) {
            throw new IllegalStateException("User authentication required");
        }

        log.debug("Usuario autenticado: ID={}, username={}", currentUser.getUserId(), currentUser.getUsername());

        // Verificar si ya existe un deck con el mismo nombre para este usuario
        if (deckRepository.existsByDeckNameAndUser_UserId(deckCreateDto.getDeckName(), currentUser.getUserId())) {
            log.warn("Ya existe un mazo con nombre '{}' para el usuario {}",
                    deckCreateDto.getDeckName(), currentUser.getUsername());
            throw new IllegalArgumentException(
                    "Deck with name '" + deckCreateDto.getDeckName() + "' already exists for this user");
        }

        // Crear entidad Deck
        Deck deck = deckMapper.toEntity(deckCreateDto, currentUser);
        deck.setTotalCards(0); // Inicializar contador de cartas

        Deck savedDeck = deckRepository.save(deck);
        log.info("Mazo creado exitosamente con ID: {}", savedDeck.getDeckId());

        return deckMapper.toDto(savedDeck);
    }

    @Override
    @Transactional
    public DeckDto updateDeck(Long id, DeckDto deckDto) {
        Deck existingDeck = deckRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + id));

        // Verificar si el nuevo nombre ya existe para otro deck del mismo usuario
        if (!existingDeck.getDeckName().equals(deckDto.getDeckName()) &&
                deckRepository.existsByDeckNameAndUser_UserId(deckDto.getDeckName(), deckDto.getUserId())) {
            throw new IllegalArgumentException(
                    "Deck with name '" + deckDto.getDeckName() + "' already exists for this user");
        }

        // Actualizar campos básicos
        existingDeck.setDeckName(deckDto.getDeckName());
        existingDeck.setGameType(deckDto.getGameType());
        existingDeck.setDeckColor(deckDto.getDeckColor());
        existingDeck.setTotalCards(deckDto.getTotalCards());

        Deck updatedDeck = deckRepository.save(existingDeck);
        return deckMapper.toDto(updatedDeck);
    }

    @Override
    @Transactional
    public void deleteDeck(Long id) {
        Deck deck = deckRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + id));

        log.info("Eliminando mazo con ID: {} y todas sus cartas asociadas", id);
        deckRepository.delete(deck);
        log.info("Mazo con ID: {} eliminado exitosamente", id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckDto> getDecksByUser(Long userId) {
        log.info("Buscando mazos para usuario ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<Deck> decks = deckRepository.findByUser_UserId(userId);
        log.info("Se encontraron {} mazos para el usuario {}", decks.size(), user.getUsername());

        return decks.stream()
                .map(deckMapper::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public int getCardCountInDeck(Long deckId) {
        return deckRepository.findById(deckId)
                .map(Deck::getTotalCards)
                .orElse(0);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DeckDto> getDecksByUserPaged(Long userId, Pageable pageable) {
        return deckRepository.findByUser_UserId(userId, pageable)
                .map(deckMapper::toDto);
    }

    @Override
    @Transactional
    public DeckDto updateDeckColor(Long deckId) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + deckId));

        // Obtener todas las cartas del deck
        List<CardDeck> deckCards = cardDeckRepository.findByDeck_DeckId(deckId);

        if (deckCards.isEmpty()) {
            // Si no hay cartas, el deck no tiene color
            deck.setDeckColor(null);
            log.debug("Deck {} has no cards, setting color to null", deckId);
        } else {
            // Calcular el color basado en las cartas del deck
            String calculatedColor = calculateDeckColor(deckCards);
            deck.setDeckColor(calculatedColor);
            log.debug("Deck {} color calculated as: {}", deckId, calculatedColor);
        }

        Deck updatedDeck = deckRepository.save(deck);
        return deckMapper.toDto(updatedDeck);
    }

    /**
     * Calcula el color del deck basado en las cartas que contiene
     * 
     * @param deckCards Lista de cartas del deck
     * @return String representando el color del deck
     */
    private String calculateDeckColor(List<CardDeck> deckCards) {
        Set<String> colors = new HashSet<>();

        // Analizamos cada carta en el deck
        for (CardDeck cardDeck : deckCards) {
            String manaCost = cardDeck.getCard().getManaCost();
            if (manaCost != null && !manaCost.trim().isEmpty()) {
                // Extraer colores del coste de maná
                Set<String> cardColors = extractColorsFromManaCost(manaCost);
                colors.addAll(cardColors);
            }
        }

        log.debug("Colors found in deck: {}", colors);

        // Determinar el tipo de color del deck
        if (colors.isEmpty()) {
            return "colorless";
        } else if (colors.size() == 1) {
            // Mapear símbolos de mana a nombres de colores
            String color = colors.iterator().next();
            return mapManaSymbolToColorName(color);
        } else {
            // Deck multicolor - convertir los símbolos a nombres de colores y combinarlos
            return colors.stream()
                    .map(this::mapManaSymbolToColorName)
                    .sorted() // Ordenar alfabéticamente para consistencia
                    .reduce((a, b) -> a + " " + b)
                    .orElse("multicolor");
        }
    }

    /**
     * Extrae los símbolos de color del coste de maná
     * 
     * @param manaCost String del coste de maná (ej: "{2}{W}{U}")
     * @return Set de símbolos de color encontrados
     */
    private Set<String> extractColorsFromManaCost(String manaCost) {
        Set<String> colors = new HashSet<>();

        // Patrón para encontrar símbolos de mana de color: {W}, {U}, {B}, {R}, {G}
        Pattern colorPattern = Pattern.compile("\\{([WUBRG])\\}");
        Matcher matcher = colorPattern.matcher(manaCost);

        while (matcher.find()) {
            colors.add(matcher.group(1)); // Agregar solo la letra (W, U, B, R, G)
        }

        return colors;
    }

    /**
     * Mapea símbolos de mana a nombres de colores
     * 
     * @param manaSymbol Símbolo de mana (W, U, B, R, G)
     * @return Nombre del color correspondiente
     */
    private String mapManaSymbolToColorName(String manaSymbol) {
        switch (manaSymbol) {
            case "W":
                return "white";
            case "U":
                return "blue";
            case "B":
                return "black";
            case "R":
                return "red";
            case "G":
                return "green";
            default:
                return "colorless";
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckDto> getDecksByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        return getDecksByUser(user.getUserId());
    }
}