package com.setcollectormtg.setcollectormtg.service;

import com.setcollectormtg.setcollectormtg.dto.DeckCreateDto;
import com.setcollectormtg.setcollectormtg.dto.DeckDto;
import com.setcollectormtg.setcollectormtg.exception.ResourceNotFoundException;
import com.setcollectormtg.setcollectormtg.mapper.DeckMapper;
import com.setcollectormtg.setcollectormtg.model.CardDeck;
import com.setcollectormtg.setcollectormtg.model.Deck;
import com.setcollectormtg.setcollectormtg.model.User;
import com.setcollectormtg.setcollectormtg.repository.CardDeckRepository;
import com.setcollectormtg.setcollectormtg.repository.DeckRepository;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeckServiceImpl implements DeckService {

    private final DeckRepository deckRepository;
    private final UserRepository userRepository;
    private final CardDeckRepository cardDeckRepository;
    private final DeckMapper deckMapper;

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

    /**
     * Crea un nuevo mazo para el usuario autenticado, validando que no exista otro mazo con el mismo nombre para ese usuario.
     * Lanza excepción si el nombre ya está en uso.
     *
     * @param deckCreateDto DTO con los datos del mazo a crear
     * @return DTO del mazo creado
     */
    @Override
    @Transactional
    public DeckDto createDeck(DeckCreateDto deckCreateDto) {
        try {
            log.debug("Iniciando proceso de creación de mazo: {}", deckCreateDto);
            
            // Obtener el usuario autenticado
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                log.error("Intento de crear mazo sin autenticación");
                throw new IllegalStateException("User authentication required");
            }
            
            if (!(authentication.getPrincipal() instanceof Jwt)) {
                log.error("Principal no es un JWT: {}", authentication.getPrincipal().getClass().getName());
                throw new IllegalStateException("JWT authentication required");
            }
            
            Jwt jwt = (Jwt) authentication.getPrincipal();
            String keycloakId = jwt.getSubject();
            log.debug("ID de Keycloak del usuario autenticado: {}", keycloakId);

            // Buscar el usuario por su keycloakId
            User user = userRepository.findByKeycloakId(keycloakId)
                    .orElseThrow(() -> {
                        log.error("No se encontró usuario con keycloakId: {}", keycloakId);
                        return new ResourceNotFoundException("Usuario no encontrado con keycloakId: " + keycloakId);
                    });
            
            log.debug("Usuario encontrado: ID={}, username={}", user.getUserId(), user.getUsername());

            // Verificar si ya existe un deck con el mismo nombre para este usuario
            if (deckRepository.existsByDeckNameAndUser_UserId(deckCreateDto.getDeckName(), user.getUserId())) {
                log.warn("Ya existe un mazo con nombre '{}' para el usuario {}", 
                        deckCreateDto.getDeckName(), user.getUsername());
                throw new IllegalArgumentException(
                        "Deck with name '" + deckCreateDto.getDeckName() + "' already exists for this user");
            }

            // Si gameType es null, establecer valor por defecto
            if (deckCreateDto.getGameType() == null) {
                log.debug("GameType no especificado, usando STANDARD por defecto");
                deckCreateDto.setGameType("STANDARD");
            }
            
            log.debug("Creando entidad Deck desde DTO");
            Deck deck = deckMapper.toEntity(deckCreateDto, user);
            deck.setTotalCards(0); // Inicializar contador de cartas
            
            // No asignar color por defecto, dejar el valor NULL
            // El color se actualizará automáticamente cuando se agreguen cartas
            
            log.debug("Guardando mazo en la base de datos");
            Deck savedDeck = deckRepository.save(deck);
            log.info("Mazo creado exitosamente con ID: {}", savedDeck.getDeckId());
            
            return deckMapper.toDto(savedDeck);
        } catch (Exception e) {
            log.error("Error al crear mazo: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Actualiza los datos de un mazo, validando que el nuevo nombre no esté repetido para el usuario.
     * Lanza excepción si el nombre ya está en uso por otro mazo del mismo usuario.
     *
     * @param id      ID del mazo a actualizar
     * @param deckDto DTO con los nuevos datos del mazo
     * @return DTO actualizado del mazo
     */
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

        // Actualizar usuario solo si es diferente
        if (!existingDeck.getUser().getUserId().equals(deckDto.getUserId())) {
            User user = userRepository.findById(deckDto.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + deckDto.getUserId()));
            existingDeck.setUser(user);
        }

        Deck updatedDeck = deckRepository.save(existingDeck);
        return deckMapper.toDto(updatedDeck);
    }

    /**
     * Elimina un mazo junto con todas sus cartas asociadas automáticamente.
     *
     * @param id ID del mazo a eliminar
     */
    @Override
    @Transactional
    public void deleteDeck(Long id) {
        Deck deck = deckRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + id));

        // La configuración CascadeType.ALL y orphanRemoval=true en la entidad Deck
        // se encargará de eliminar automáticamente todas las cartas asociadas
        log.info("Eliminando mazo con ID: {} y todas sus cartas asociadas", id);
        deckRepository.delete(deck);
        log.info("Mazo con ID: {} eliminado exitosamente", id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckDto> getDecksByUser(Long userId) {
        // Intentar tratar el userId como un posible ID de Keycloak (String)
        String userIdStr = userId.toString();
        log.info("Buscando mazos para ID: {}", userIdStr);
        
        // Verificar existencia de usuarios en la base de datos
        log.info("Total de usuarios en la base de datos: {}", userRepository.count());
        
        // Primero verificamos si es un ID de Keycloak
        Optional<User> userByKeycloak = userRepository.findByKeycloakId(userIdStr);
        
        if (userByKeycloak.isPresent()) {
            // Si encontramos al usuario por su ID de Keycloak, usamos su ID interno
            User user = userByKeycloak.get();
            Long internalUserId = user.getUserId();
            log.info("Usuario encontrado por ID de Keycloak: {}. Usando ID interno: {}, Username: {}", userIdStr, internalUserId, user.getUsername());
            
            // Buscar mazos por ID de usuario interno
            List<Deck> decks = deckRepository.findByUser_UserId(internalUserId);
            log.info("Se encontraron {} mazos para el usuario con ID interno {}", decks.size(), internalUserId);
            
            return decks.stream()
                    .map(deckMapper::toDto)
                    .toList();
        }
        
        // Si no es un ID de Keycloak, verificamos si existe un usuario con ese ID interno
        Optional<User> userById = userRepository.findById(userId);
        if (userById.isPresent()) {
            User user = userById.get();
            log.info("Usuario encontrado por ID interno: {}, Username: {}, KeycloakId: {}", userId, user.getUsername(), user.getKeycloakId());
            
            // Buscar mazos por ID de usuario interno
            List<Deck> decks = deckRepository.findByUser_UserId(userId);
            log.info("Se encontraron {} mazos para el usuario con ID interno {}", decks.size(), userId);
            
            return decks.stream()
                    .map(deckMapper::toDto)
                    .toList();
        }
        
        // Ninguna búsqueda tuvo éxito, usuario no encontrado
        log.warn("Usuario no encontrado por ID de Keycloak ni por ID interno: {}", userId);
        return List.of(); // Devolver lista vacía
    }

    @Override
    @Transactional(readOnly = true)
    public int getCardCountInDeck(Long deckId) {
        return cardDeckRepository.countByDeck_DeckId(deckId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DeckDto> getDecksByUserPaged(Long userId, Pageable pageable) {
        // Similar a getDecksByUser, pero para paginación
        String userIdStr = userId.toString();
        Optional<User> userByKeycloak = userRepository.findByKeycloakId(userIdStr);
        
        if (userByKeycloak.isPresent()) {
            Long internalUserId = userByKeycloak.get().getUserId();
            return deckRepository.findByUser_UserId(internalUserId, pageable).map(deckMapper::toDto);
        }
        
        return deckRepository.findByUser_UserId(userId, pageable).map(deckMapper::toDto);
    }
    
    /**
     * Analiza las cartas en un mazo y determina su color automáticamente
     * basado en los símbolos de mana de las cartas.
     * 
     * @param deckId ID del mazo a actualizar
     * @return DTO del mazo con el color actualizado
     */
    @Override
    @Transactional
    public DeckDto updateDeckColor(Long deckId) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + deckId));
        
        // Si el mazo no tiene cartas, mantener el color como NULL
        if (deck.getCardDecks().isEmpty()) {
            log.info("El mazo con ID {} no tiene cartas, manteniendo color como NULL", deckId);
            deck.setDeckColor(null);
            return deckMapper.toDto(deckRepository.save(deck));
        }
        
        // Mapeamos los símbolos de mana a colores
        boolean hasWhite = false;
        boolean hasBlue = false;
        boolean hasBlack = false;
        boolean hasRed = false;
        boolean hasGreen = false;
        
        // Analizamos todas las cartas en el mazo
        for (CardDeck cardDeck : deck.getCardDecks()) {
            String manaCost = cardDeck.getCard().getManaCost();
            if (manaCost == null) continue;
            
            // Buscar símbolos de color en el coste de maná
            if (manaCost.contains("{W}")) hasWhite = true;
            if (manaCost.contains("{U}")) hasBlue = true;
            if (manaCost.contains("{B}")) hasBlack = true;
            if (manaCost.contains("{R}")) hasRed = true;
            if (manaCost.contains("{G}")) hasGreen = true;
        }
        
        // Determinar el color del mazo
        StringBuilder deckColor = new StringBuilder();
        
        // Siempre agregar los colores individuales, incluso si hay más de 2
        if (hasWhite) deckColor.append("white ");
        if (hasBlue) deckColor.append("blue ");
        if (hasBlack) deckColor.append("black ");
        if (hasRed) deckColor.append("red ");
        if (hasGreen) deckColor.append("green ");
        
        // Si no hay colores, es incoloro
        if (deckColor.length() == 0) {
            deck.setDeckColor("colorless");
            log.info("Mazo con ID {} es incoloro", deckId);
        } else {
            // Eliminar el espacio final si existe
            if (deckColor.charAt(deckColor.length() - 1) == ' ') {
                deckColor.deleteCharAt(deckColor.length() - 1);
            }
            deck.setDeckColor(deckColor.toString());
            log.info("Actualizando color del mazo con ID {}: {}", deckId, deck.getDeckColor());
        }
        
        return deckMapper.toDto(deckRepository.save(deck));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckDto> getDecksByUsername(String username) {
        log.info("Buscando mazos para usuario con username: {}", username);
        
        Optional<User> userByUsername = userRepository.findByUsername(username);
        
        if (userByUsername.isPresent()) {
            User user = userByUsername.get();
            log.info("Usuario encontrado por username: {}, ID: {}, KeycloakId: {}", 
                    username, user.getUserId(), user.getKeycloakId());
            
            List<Deck> decks = deckRepository.findByUser_UserId(user.getUserId());
            log.info("Se encontraron {} mazos para el usuario con username {}", decks.size(), username);
            
            return decks.stream()
                    .map(deckMapper::toDto)
                    .toList();
        }
        
        log.warn("No se encontró usuario con username: {}", username);
        return List.of();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<DeckDto> getDecksByKeycloakId(String keycloakId) {
        log.info("Buscando mazos para usuario con keycloakId: {}", keycloakId);
        
        Optional<User> userByKeycloak = userRepository.findByKeycloakId(keycloakId);
        
        if (userByKeycloak.isPresent()) {
            User user = userByKeycloak.get();
            log.info("Usuario encontrado por keycloakId: {}, ID: {}, Username: {}", 
                    keycloakId, user.getUserId(), user.getUsername());
            
            List<Deck> decks = deckRepository.findByUser_UserId(user.getUserId());
            log.info("Se encontraron {} mazos para el usuario con keycloakId {}", decks.size(), keycloakId);
            
            return decks.stream()
                    .map(deckMapper::toDto)
                    .toList();
        }
        
        log.warn("No se encontró usuario con keycloakId: {}", keycloakId);
        return List.of();
    }
}