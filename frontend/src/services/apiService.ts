import { httpClient } from './httpClient';
import authService from './authService';
import { SetMtg, Card, Deck, DeckCreateDto, CardDeck, User } from './types';

// Usando el proxy configurado en vite.config.ts
const API_URL = '/api';

// Servicio para operaciones de la API
const apiService = {
  // Sets
  getAllSets: async (): Promise<SetMtg[]> => {
    console.log('Solicitando todos los sets');
    return httpClient.get<SetMtg[]>('/sets');
  },

  getSetById: async (id: number): Promise<SetMtg> => {
    console.log(`Solicitando set ${id}`);
    return httpClient.get<SetMtg>(`/sets/${id}`);
  },

  getCardsBySet: async (setId: number): Promise<Card[]> => {
    console.log(`Solicitando cartas del set ${setId}`);
    return httpClient.get<Card[]>(`/sets/${setId}/cards`);
  },

  // Decks
  getUserDecks: async (userId?: number): Promise<Deck[]> => {
    try {
      // Si no se proporciona userId, obtenerlo del token
      if (userId === undefined) {
        const userIdFromToken = authService.getUserId();
        if (userIdFromToken === null) {
          throw new Error('No se pudo determinar el ID del usuario');
        }
        userId = userIdFromToken;
      }
      
      // Verificar si tenemos un identificador alternativo almacenado
      const altIdentifier = localStorage.getItem('user_identifier');
      
      console.log(`Solicitando mazos del usuario ${userId}${altIdentifier ? ` (identificador alternativo: ${altIdentifier})` : ''}`);
      
      // Intento 1: Usar userId numérico
      try {
        console.log(`Intentando obtener mazos con ID numérico: ${userId}`);
        const decks = await httpClient.get<Deck[]>(`/decks/user/${userId}`);
        
        if (Array.isArray(decks) && decks.length > 0) {
          console.log(`Éxito! Se encontraron ${decks.length} mazos con ID numérico`);
          return decks;
        } else {
          console.log('No se encontraron mazos con ID numérico');
        }
      } catch (error) {
        console.error(`Error al obtener mazos con ID numérico: ${userId}`, error);
      }
      
      // Intento 2: Usar identificador alternativo si está disponible
      if (altIdentifier) {
        try {
          console.log(`Intentando obtener mazos con identificador alternativo: ${altIdentifier}`);
          const decks = await httpClient.get<Deck[]>(`/decks/user/byUsername/${altIdentifier}`);
          
          if (Array.isArray(decks) && decks.length > 0) {
            console.log(`Éxito! Se encontraron ${decks.length} mazos con identificador alternativo`);
            return decks;
          } else {
            console.log('No se encontraron mazos con identificador alternativo');
          }
        } catch (error) {
          console.error(`Error al obtener mazos con identificador alternativo: ${altIdentifier}`, error);
        }
      }
      
      // Intento 3: Usar endpoint alternativo que busque al usuario por cualquier identificador
      try {
        console.log(`Intentando obtener mazos con endpoint de fallback`);
        const decks = await httpClient.get<Deck[]>('/decks/current-user');
        
        if (Array.isArray(decks) && decks.length > 0) {
          console.log(`Éxito! Se encontraron ${decks.length} mazos con endpoint de fallback`);
          return decks;
        } else {
          console.log('No se encontraron mazos con endpoint de fallback');
        }
      } catch (error) {
        console.error('Error al obtener mazos con endpoint de fallback', error);
      }
      
      // Si llegamos aquí, ningún intento funcionó
      console.warn('Todos los intentos fallaron, devolviendo array vacío o datos simulados');
      
      // Devolver datos simulados en cualquier caso
      console.log('Devolviendo datos simulados');
      const userIdForMocks = userId;
      
      return [
        {
          deckId: 1,
          deckName: 'Mazo Azul (simulado)',
          gameType: 'STANDARD',
          deckColor: 'blue',
          totalCards: 60,
          userId: userIdForMocks
        },
        {
          deckId: 2,
          deckName: 'Mazo Rojo (simulado)',
          gameType: 'COMMANDER',
          deckColor: 'red',
          totalCards: 100,
          userId: userIdForMocks
        },
        {
          deckId: 3,
          deckName: 'Mazo Verde (simulado)',
          gameType: 'MODERN',
          deckColor: 'green',
          totalCards: 60,
          userId: userIdForMocks
        }
      ];
    } catch (error: any) {
      console.error(`Error al obtener mazos del usuario:`, error);
      return [];
    }
  },

  getDeckById: async (deckId: number): Promise<Deck> => {
    try {
      console.log(`Solicitando mazo ${deckId}`);
      const deck = await httpClient.get<Deck>(`/decks/${deckId}`);
      
      // No actualizamos automáticamente los colores nulos
      // Se actualizarán cuando se añadan cartas al mazo
      return deck;
    } catch (error) {
      console.error('Error al obtener mazo por ID:', error);
      
      // Mazo predeterminado para desarrollo
      return {
        deckId: deckId,
        deckName: 'Mazo no encontrado',
        gameType: 'STANDARD',
        deckColor: '',
        totalCards: 0,
        userId: authService.getUserId() ?? 1
      };
    }
  },

  createDeck: async (deckData: DeckCreateDto): Promise<Deck> => {
    try {
      // Asegurarse de que el userId está establecido
      const userId = authService.getUserId();
      if (userId === null) {
        throw new Error('No se pudo determinar el ID del usuario');
      }
      
      // Crear objeto completo para enviar al backend
      const deckToCreate = {
        ...deckData,
        userId
      };
      
      console.log('Creando nuevo mazo:', deckToCreate);
      return httpClient.post<Deck>('/decks', deckToCreate);
    } catch (error) {
      console.error('Error al crear mazo:', error);
      
      // Simular respuesta para desarrollo
      return {
        deckId: Math.floor(Math.random() * 1000) + 10,
        deckName: deckData.deckName,
        gameType: deckData.gameType,
        deckColor: deckData.deckColor,
        totalCards: 0,
        userId: authService.getUserId() ?? 1
      };
    }
  },

  updateDeck: async (deckId: number, deckData: Deck): Promise<Deck> => {
    console.log(`Actualizando mazo ${deckId}:`, deckData);
    return httpClient.put<Deck>(`/decks/${deckId}`, deckData);
  },

  deleteDeck: async (deckId: number): Promise<void> => {
    console.log(`Eliminando mazo ${deckId}`);
    await httpClient.delete(`/decks/${deckId}`);
  },

  // Cards in Deck
  getCardsByDeck: async (deckId: number): Promise<CardDeck[]> => {
    try {
      console.log(`Solicitando cartas del mazo ${deckId}`);
      return httpClient.get<CardDeck[]>(`/decks/${deckId}/cards`);
    } catch (error) {
      console.error(`Error al obtener cartas del mazo ${deckId}:`, error);
      return [];
    }
  },

  addCardToDeck: async (deckId: number, cardId: number, quantity: number = 1): Promise<CardDeck> => {
    try {
      console.log(`Añadiendo carta ${cardId} al mazo ${deckId} (${quantity} copias)`);
      return httpClient.post<CardDeck>(
        `/decks/${deckId}/cards/${cardId}`, 
        {}, 
        { params: { quantity } }
      );
    } catch (error) {
      console.error(`Error al añadir carta ${cardId} al mazo ${deckId}:`, error);
      throw error;
    }
  },

  updateCardInDeck: async (deckId: number, cardId: number, quantity: number): Promise<CardDeck> => {
    console.log(`Actualizando cantidad de carta ${cardId} en mazo ${deckId} a ${quantity}`);
    return httpClient.put<CardDeck>(
      `/decks/${deckId}/cards/${cardId}`, 
      {}, 
      { params: { quantity } }
    );
  },

  removeCardFromDeck: async (deckId: number, cardId: number): Promise<void> => {
    console.log(`Eliminando carta ${cardId} del mazo ${deckId}`);
    await httpClient.delete(`/decks/${deckId}/cards/${cardId}`);
  },

  // Cards
  getAllCards: async (): Promise<Card[]> => {
    console.log('Solicitando todas las cartas');
    return httpClient.get<Card[]>('/cards');
  },

  getCardById: async (id: number): Promise<Card> => {
    console.log(`Solicitando carta ${id}`);
    return httpClient.get<Card>(`/cards/${id}`);
  },

  // Users
  getUserByUsername: async (username: string): Promise<User> => {
    try {
      console.log(`Solicitando usuario ${username}`);
      return httpClient.get<User>(`/users/username/${username}`);
    } catch (error) {
      console.error(`Error getting user by username ${username}:`, error);
      throw error;
    }
  },

  updateUserProfile: async (username: string, userData: Partial<User>): Promise<User> => {
    try {
      console.log(`Actualizando perfil del usuario ${username}:`, userData);
      return httpClient.put<User>(`/users/username/${username}`, userData);
    } catch (error) {
      console.error(`Error updating user profile for ${username}:`, error);
      throw error;
    }
  }
};

export default apiService;
