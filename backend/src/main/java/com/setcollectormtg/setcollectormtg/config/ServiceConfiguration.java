package com.setcollectormtg.setcollectormtg.config;

import com.setcollectormtg.setcollectormtg.mapper.DeckMapper;
import com.setcollectormtg.setcollectormtg.util.CurrentUserUtil;
import com.setcollectormtg.setcollectormtg.repository.DeckRepository;
import com.setcollectormtg.setcollectormtg.repository.UserRepository;
import com.setcollectormtg.setcollectormtg.repository.CardDeckRepository;
import com.setcollectormtg.setcollectormtg.service.DeckService;
import com.setcollectormtg.setcollectormtg.service.DeckServiceImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Configuración de servicios para resolver dependencias circulares
 */
@Configuration
public class ServiceConfiguration {

    /**
     * Define explícitamente el bean DeckService para evitar problemas de
     * dependencia circular
     * con CardDeckService
     */
    @Bean
    @Primary
    public DeckService deckService(
            DeckRepository deckRepository,
            UserRepository userRepository,
            CardDeckRepository cardDeckRepository,
            DeckMapper deckMapper,
            CurrentUserUtil currentUserUtil) {
        return new DeckServiceImpl(deckRepository, userRepository, cardDeckRepository, deckMapper, currentUserUtil);
    }
}