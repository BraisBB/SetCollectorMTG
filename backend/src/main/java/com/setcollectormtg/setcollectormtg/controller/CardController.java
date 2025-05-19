package com.setcollectormtg.setcollectormtg.controller;

import com.setcollectormtg.setcollectormtg.dto.CardCreateDto;
import com.setcollectormtg.setcollectormtg.dto.CardDto;
import com.setcollectormtg.setcollectormtg.service.CardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/cards")
@RequiredArgsConstructor
public class CardController {

    private static final Logger logger = LoggerFactory.getLogger(CardController.class);

    static {
        logger.info("CardController class loaded");
        logger.info("ClassLoader: " + CardController.class.getClassLoader());
    }

    private final CardService cardService;

    /**
     * Obtiene todas las cartas o las filtra por parámetros si están presentes.
     *
     * @param name Nombre o parte del nombre (opcional)
     * @param cardType Tipo de carta (opcional)
     * @param color Color de la carta (W, U, B, R, G o colorless) (opcional)
     * @param manaCostMin Coste mínimo de maná (opcional)
     * @param manaCostMax Coste máximo de maná (opcional)
     * @return Lista de todas las cartas o filtradas
     */
    @GetMapping
    public ResponseEntity<List<CardDto>> getAllCards(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String setCode,
            @RequestParam(required = false) String rarity,
            @RequestParam(required = false) Integer manaCostMin,
            @RequestParam(required = false) Integer manaCostMax) {
        
        List<CardDto> cards;
        
        // Si hay algún filtro aplicado, utilizamos la búsqueda con filtros
        if (name != null || type != null || color != null || setCode != null || rarity != null || manaCostMin != null || manaCostMax != null) {
            cards = cardService.getCardsByFilters(name, type, color, setCode, rarity, manaCostMin, manaCostMax);
        } else {
            // Si no hay filtros, devolver todas las cartas
            cards = cardService.getAllCards();
        }
        
        // Añadir logging para verificar contenido
        cards.forEach(card -> {
            System.out.println("Card: " + 
                "id=" + card.getCardId() + 
                ", name=" + card.getName() + 
                ", setId=" + card.getSetId() + 
                ", oracleText=" + card.getOracleText()
            );
        });
        
        return ResponseEntity.ok(cards);
    }

    /**
     * Obtiene una carta por su ID.
     *
     * @param id ID de la carta
     * @return Carta encontrada
     */
    @GetMapping("/{id}")
    public ResponseEntity<CardDto> getCardById(@PathVariable Long id) {
        return ResponseEntity.ok(cardService.getCardById(id));
    }

    /**
     * Busca cartas aplicando filtros.
     * 
     * @param name Nombre o parte del nombre (opcional)
     * @param cardType Tipo de carta (opcional)
     * @param color Color de la carta (W, U, B, R, G o colorless) (opcional)
     * @param setCode Código del set (opcional)
     * @param rarity Rareza de la carta (opcional)
     * @param manaCostMin Coste mínimo de maná (opcional)
     * @param manaCostMax Coste máximo de maná (opcional)
     * @return Lista de cartas que cumplen los criterios
     */
    @GetMapping("/search")
    public ResponseEntity<List<CardDto>> searchCards(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String cardType,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String setCode,
            @RequestParam(required = false) String rarity,
            @RequestParam(required = false) Integer manaCostMin,
            @RequestParam(required = false) Integer manaCostMax) {
        
        return ResponseEntity.ok(cardService.getCardsByFilters(name, cardType, color, setCode, rarity, manaCostMin, manaCostMax));
    }

    /**
     * Crea una nueva carta.
     *
     * @param cardCreateDto DTO con los datos de la carta a crear
     * @return Carta creada
     */
    @PostMapping
    public ResponseEntity<CardDto> createCard(@Valid @RequestBody CardCreateDto cardCreateDto) {
        return new ResponseEntity<>(cardService.createCard(cardCreateDto), HttpStatus.CREATED);
    }

    /**
     * Actualiza una carta existente.
     *
     * @param id      ID de la carta a actualizar
     * @param cardDto DTO con los nuevos datos
     * @return Carta actualizada
     */
    @PutMapping("/{id}")
    public ResponseEntity<CardDto> updateCard(@PathVariable Long id, @Valid @RequestBody CardDto cardDto) {
        logger.info("Recibida solicitud para actualizar carta con ID: {}", id);
        logger.info("Datos recibidos: {}", cardDto);
        
        CardDto updatedCard = cardService.updateCard(id, cardDto);
        logger.info("Carta actualizada: {}", updatedCard);
        
        return ResponseEntity.ok(updatedCard);
    }

    /**
     * Elimina una carta.
     *
     * @param id ID de la carta a eliminar
     * @return Respuesta sin contenido
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCard(@PathVariable Long id) {
        cardService.deleteCard(id);
        return ResponseEntity.noContent().build();
    }
}