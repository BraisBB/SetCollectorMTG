package com.setcollectormtg.setcollectormtg.repository;

import com.setcollectormtg.setcollectormtg.model.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CardRepository extends JpaRepository<Card, Long> {

       // Buscar cartas por nombre (parcial, ignorando mayúsculas/minúsculas)
       List<Card> findByNameContainingIgnoreCase(String name);

       // Buscar cartas por tipo (parcial, ignorando mayúsculas/minúsculas)
       List<Card> findByCardTypeContainingIgnoreCase(String cardType);

       // Buscar cartas por color en manaCost (usando LIKE para encontrar símbolos de
       // color)
       @Query("SELECT c FROM Card c WHERE c.manaCost LIKE %:colorSymbol%")
       List<Card> findByColorSymbol(@Param("colorSymbol") String colorSymbol);

       // Buscar cartas incoloras (que no contengan símbolos de colores W, U, B, R, G
       // en su coste de maná)
       @Query("SELECT c FROM Card c WHERE " +
                     "(c.manaCost IS NULL OR " +
                     "c.manaCost NOT LIKE '%W%' AND " +
                     "c.manaCost NOT LIKE '%U%' AND " +
                     "c.manaCost NOT LIKE '%B%' AND " +
                     "c.manaCost NOT LIKE '%R%' AND " +
                     "c.manaCost NOT LIKE '%G%')")
       List<Card> findColorlessCards();

       // Método combinado para buscar por múltiples criterios
       @Query("SELECT c FROM Card c WHERE " +
                     "(:name IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
                     "(:cardType IS NULL OR LOWER(c.cardType) LIKE LOWER(CONCAT('%', :cardType, '%'))) AND " +
                     "(:rarity IS NULL OR LOWER(c.rarity) = LOWER(:rarity)) AND " +
                     "(:setCode IS NULL OR c.setMtg.setCode = :setCode) AND " +
                     "(:colorSymbol IS NULL OR " +
                     "(:colorSymbol = 'C' AND (c.manaCost IS NULL OR " +
                     "c.manaCost NOT LIKE '%W%' AND " +
                     "c.manaCost NOT LIKE '%U%' AND " +
                     "c.manaCost NOT LIKE '%B%' AND " +
                     "c.manaCost NOT LIKE '%R%' AND " +
                     "c.manaCost NOT LIKE '%G%')) OR " +
                     "(:colorSymbol != 'C' AND c.manaCost LIKE CONCAT('%', :colorSymbol, '%'))) AND " +
                     "(:manaCostMin IS NULL OR c.manaValue >= :manaCostMin) AND " +
                     "(:manaCostMax IS NULL OR c.manaValue <= :manaCostMax)")
       List<Card> findByFilters(
                     @Param("name") String name,
                     @Param("cardType") String cardType,
                     @Param("rarity") String rarity,
                     @Param("setCode") String setCode,
                     @Param("colorSymbol") String colorSymbol,
                     @Param("manaCostMin") Integer manaCostMin,
                     @Param("manaCostMax") Integer manaCostMax);
}
