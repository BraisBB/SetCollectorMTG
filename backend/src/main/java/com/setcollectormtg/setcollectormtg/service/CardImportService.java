package com.setcollectormtg.setcollectormtg.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.setcollectormtg.setcollectormtg.model.Card;
import com.setcollectormtg.setcollectormtg.model.SetMtg;
import com.setcollectormtg.setcollectormtg.repository.CardRepository;
import com.setcollectormtg.setcollectormtg.repository.SetMtgRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CardImportService {

    private final CardRepository cardRepository;
    private final SetMtgRepository setMtgRepository;
    private final ScryfallService scryfallService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Importa un set y todas sus cartas desde un archivo JSON exportado (por
     * ejemplo, de Scryfall).
     * Procesa primero la información del set y luego importa todas las cartas
     * asociadas.
     * Lanza excepción si ocurre un error de lectura o formato.
     *
     * @param jsonFilePath Ruta al archivo JSON del set
     * @throws IOException Si ocurre un error de lectura del archivo
     */
    @Transactional
    public void importSetFromJson(String jsonFilePath) throws IOException {
        JsonNode rootNode = objectMapper.readTree(new File(jsonFilePath));

        // Primero procesamos la información del set
        SetMtg setMtg = processSetInfo(rootNode);
        setMtgRepository.save(setMtg);

        // Luego procesamos las cartas
        processCards(rootNode.path("data").path("cards"), setMtg);
    }

    /**
     * Procesa la información general del set a partir del nodo raíz del JSON.
     *
     * @param rootNode Nodo raíz del JSON
     * @return Entidad SetMtg creada a partir del JSON
     */
    private SetMtg processSetInfo(JsonNode rootNode) {
        JsonNode setInfo = rootNode.path("data");

        SetMtg setMtg = new SetMtg();
        setMtg.setSetCode(setInfo.path("code").asText());
        setMtg.setName(setInfo.path("name").asText());

        if (setInfo.has("released_at")) {
            setMtg.setReleaseDate(LocalDate.parse(setInfo.path("released_at").asText(), DATE_FORMATTER));
        }

        if (setInfo.has("card_count")) {
            setMtg.setTotalCards(setInfo.path("card_count").asInt());
        }

        return setMtg;
    }

    /**
     * Procesa y guarda todas las cartas de un set a partir del nodo JSON
     * correspondiente.
     * Actualiza el total de cartas en el set.
     *
     * @param cardsNode Nodo JSON con las cartas
     * @param setMtg    Set al que pertenecen las cartas
     */
    private void processCards(JsonNode cardsNode, SetMtg setMtg) {
        List<Card> cards = new ArrayList<>();

        cardsNode.forEach(cardNode -> {
            try {
                Card card = mapJsonToCard(cardNode, setMtg);
                if (card != null) {
                    cards.add(card);
                }
            } catch (Exception e) {
                log.error("Error procesando carta: {}", cardNode.path("name").asText(), e);
            }
        });

        // Guardamos todas las cartas
        cardRepository.saveAll(cards);

        // Actualizamos el total de cartas en el set con el conteo real
        setMtg.setTotalCards(cards.size());
        setMtgRepository.save(setMtg);

        log.info("Importadas {} cartas para el set {}", cards.size(), setMtg.getSetCode());
    }

    /**
     * Mapea un nodo JSON de carta a una entidad Card, asociándola al set
     * correspondiente.
     * Si la carta no tiene nombre, retorna null.
     *
     * @param cardNode Nodo JSON de la carta
     * @param setMtg   Set al que pertenece la carta
     * @return Entidad Card o null si no es válida
     */
    private Card mapJsonToCard(JsonNode cardNode, SetMtg setMtg) {
        if (!cardNode.has("name")) {
            log.warn("Carta sin nombre encontrada");
            return null;
        }

        Card card = new Card();
        card.setName(cardNode.path("name").asText());
        card.setRarity(cardNode.path("rarity").asText());
        card.setManaValue(cardNode.path("manaValue").asDouble(0));
        card.setManaCost(cardNode.path("manaCost").asText());
        card.setCardType(cardNode.path("type").asText());
        card.setOracleText(cardNode.path("text").asText());
        card.setSetMtg(setMtg);

        // Procesar imagen desde Scryfall
        if (cardNode.has("identifiers") && cardNode.path("identifiers").has("scryfallId")) {
            String scryfallId = cardNode.path("identifiers").path("scryfallId").asText();
            card.setImageUrl(scryfallService.generateImageUrl(scryfallId));
        }

        return card;
    }
}