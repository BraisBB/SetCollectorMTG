package com.setcollectormtg.setcollectormtg.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.setcollectormtg.setcollectormtg.model.Card;
import com.setcollectormtg.setcollectormtg.model.SetMtg;
import com.setcollectormtg.setcollectormtg.repository.CardRepository;
import com.setcollectormtg.setcollectormtg.repository.SetMtgRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.time.LocalDate;

@Service
public class MTGJsonImportService {

    @Autowired
    private CardRepository cardRepository;

    @Autowired
    private SetMtgRepository setMtgRepository;

    public void importSetFromJson(String filePath) {
        try {
            // Leer el archivo JSON
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode rootNode = objectMapper.readTree(new File(filePath));

            // Obtener el nodo de cartas
            JsonNode cardsNode = rootNode.path("data").path("cards");

            // Recorrer las cartas
            for (JsonNode cardNode : cardsNode) {
                // Crear la entidad Card
                Card card = new Card();
                card.setName(cardNode.path("name").asText());
                card.setRarity(cardNode.path("rarity").asText());
                card.setOracleText(cardNode.path("text").asText());
                card.setManaValue(cardNode.path("manaValue").asInt());
                card.setManaCost(cardNode.path("manaCost").asText());
                card.setCardType(cardNode.path("type").asText());

                // Obtener o crear el SetMtg
                String setCode = cardNode.path("setCode").asText();
                SetMtg setMtg = setMtgRepository.findBySetCode(setCode)
                        .orElseGet(() -> {
                            SetMtg newSet = new SetMtg();
                            newSet.setSetCode(setCode);
                            newSet.setName("Set Name");  // Asigna el nombre del set
                            newSet.setReleaseDate(LocalDate.now());  // Asigna una fecha de lanzamiento
                            newSet.setTotalCards(0);  // Asigna un valor inicial para totalCards
                            return setMtgRepository.save(newSet);
                        });

                card.setSetMtg(setMtg);

                // Guardar la carta en la base de datos
                cardRepository.save(card);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}