package com.setcollectormtg.setcollectormtg.model;

import lombok.Getter;
import lombok.AllArgsConstructor;

/**
 * Enum que representa los diferentes tipos de formatos de juego en Magic: The Gathering.
 * Define las reglas específicas para cada formato en términos de límites de cartas.
 */
@Getter
@AllArgsConstructor
public enum GameType {
    /**
     * Formato Standard:
     * - Requiere exactamente 60 cartas
     * - Permite hasta 4 copias de cada carta
     */
    STANDARD("Standard", 60, 4),

    /**
     * Formato Commander:
     * - Requiere exactamente 100 cartas
     * - Permite solo 1 copia de cada carta
     */
    COMMANDER("Commander", 100, 1);

    private final String name;
    private final int requiredCards;
    private final int maxCopies;

    /**
     * Convierte una cadena de texto en el tipo de juego correspondiente.
     *
     * @param gameType el nombre del tipo de juego
     * @return el enum GameType correspondiente
     * @throws IllegalArgumentException si el tipo de juego no es válido
     */
    public static GameType fromString(String gameType) {
        try {
            return GameType.valueOf(gameType.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid game type: " + gameType);
        }
    }
}