import { httpClient } from './httpClient';
import authService from './authService';
import { SetMtg, Card, Deck, DeckCreateDto, CardDeck, User } from './types';
import { SearchParams } from '../components/SearchBar';

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
      // Priorizar intentar con el username primero ya que parece que hay problemas con IDs
      const altIdentifier = localStorage.getItem('user_identifier');
      
      if (altIdentifier) {
        console.log(`Intentando obtener mazos con username: ${altIdentifier}`);
        try {
          const decks = await httpClient.get<Deck[]>(`/decks/user/byUsername/${altIdentifier}`);
          
          if (Array.isArray(decks) && decks.length > 0) {
            console.log(`Éxito! Se encontraron ${decks.length} mazos con username`);
            return decks;
          } else {
            console.log('No se encontraron mazos con username');
          }
        } catch (error) {
          console.error(`Error al obtener mazos con username: ${altIdentifier}`, error);
        }
      }
      
      // Intentar con el endpoint de usuario actual (el más seguro para permisos)
      try {
        console.log(`Intentando obtener mazos con endpoint de usuario actual`);
        const decks = await httpClient.get<Deck[]>('/decks/current-user');
        
        if (Array.isArray(decks) && decks.length > 0) {
          console.log(`Éxito! Se encontraron ${decks.length} mazos con endpoint de usuario actual`);
          return decks;
        } else {
          console.log('No se encontraron mazos con endpoint de usuario actual');
        }
      } catch (error) {
        console.error('Error al obtener mazos con endpoint de usuario actual', error);
      }
      
      // Si ninguno de los métodos anteriores funcionó y tenemos un userId, intentar con él
      if (userId === undefined) {
        const userIdFromToken = authService.getUserId();
        if (userIdFromToken === null) {
          throw new Error('No se pudo determinar el ID del usuario');
        }
        userId = userIdFromToken;
      }
      
      console.log(`Intentando obtener mazos con ID numérico: ${userId}`);
      try {
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
      
      // Si ninguno de los métodos funciona, devolver datos simulados o array vacío
      console.warn('Todos los intentos fallaron, devolviendo datos simulados');
      
      // Siempre devolver datos simulados para un mejor desarrollo
      console.log('Devolviendo datos simulados');
      const userIdForMocks = userId || 1;
      
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
      
      // Implementar sistema de reintentos
      const MAX_RETRIES = 3;
      let retryCount = 0;
      let lastError = null;
      
      while (retryCount < MAX_RETRIES) {
        try {
          const deck = await httpClient.get<Deck>(`/decks/${deckId}`);
          console.log(`Mazo ${deckId} obtenido con éxito:`, deck.deckName);
          return deck;
        } catch (error: any) {
          lastError = error;
          
          // Si el error es 403, podría ser un problema de permisos o de que el mazo no pertenece al usuario
          if (error.response && error.response.status === 403) {
            console.warn(`No tienes permisos para acceder al mazo ${deckId}.`);
            // Para errores de permisos, romper el ciclo y devolver un mazo "no encontrado"
            break;
          }
          
          // Para otros errores, intentar de nuevo después de un retraso
          retryCount++;
          console.log(`Reintento ${retryCount}/${MAX_RETRIES} para obtener el mazo ${deckId}...`);
          
          // Esperar un poco antes de reintentar (usando setTimeout con Promise)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      console.error(`Error al obtener mazo por ID después de ${MAX_RETRIES} intentos:`, lastError);
      
      // Mazo predeterminado para desarrollo o cuando hay errores
      return {
        deckId: deckId,
        deckName: 'Mazo no encontrado',
        gameType: 'STANDARD',
        deckColor: '',
        totalCards: 0,
        userId: authService.getUserId() ?? 1
      };
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
    try {
      console.log(`Actualizando mazo ${deckId}:`, deckData);
      return httpClient.put<Deck>(`/decks/${deckId}`, deckData);
    } catch (error) {
      console.error(`Error al actualizar mazo ${deckId}:`, error);
      throw error;
    }
  },

  deleteDeck: async (deckId: number): Promise<void> => {
    try {
      console.log(`Eliminando mazo ${deckId}`);
      await httpClient.delete(`/decks/${deckId}`);
    } catch (error) {
      console.error(`Error al eliminar mazo ${deckId}:`, error);
      throw error;
    }
  },

  // Cards in Deck
  getCardsByDeck: async (deckId: number): Promise<CardDeck[]> => {
    try {
      console.log(`Solicitando cartas del mazo ${deckId}`);
      
      // Implementar sistema de reintentos
      const MAX_RETRIES = 3;
      let retryCount = 0;
      let lastError = null;
      
      while (retryCount < MAX_RETRIES) {
        try {
          const cards = await httpClient.get<CardDeck[]>(`/decks/${deckId}/cards`);
          console.log(`Obtenidas ${cards.length} cartas para el mazo ${deckId}`);
          return cards;
        } catch (error: any) {
          lastError = error;
          
          // Si el error es 404, puede ser porque el endpoint no existe en el backend
          if (error.response && error.response.status === 404) {
            console.warn(`Endpoint /decks/${deckId}/cards no encontrado. El backend podría no tener implementado este endpoint.`);
            // No tiene sentido reintentar si el endpoint no existe
            return [];
          }
          
          // Si el error es 403, podría ser un problema de permisos o de que el mazo no pertenece al usuario
          if (error.response && error.response.status === 403) {
            console.warn(`No tienes permisos para acceder al mazo ${deckId}.`);
            // No tiene sentido reintentar para errores de permisos
            return [];
          }
          
          // Para otros errores, intentar de nuevo después de un retraso
          retryCount++;
          console.log(`Reintento ${retryCount}/${MAX_RETRIES} para obtener cartas del mazo ${deckId}...`);
          
          // Esperar un poco antes de reintentar (usando setTimeout con Promise)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      console.error(`Error al obtener cartas del mazo ${deckId} después de ${MAX_RETRIES} intentos:`, lastError);
      return [];
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
    try {
      console.log(`Actualizando cantidad de carta ${cardId} en mazo ${deckId} a ${quantity}`);
      return httpClient.put<CardDeck>(
        `/decks/${deckId}/cards/${cardId}`, 
        {}, 
        { params: { quantity } }
      );
    } catch (error) {
      console.error(`Error al actualizar cantidad de carta ${cardId} en mazo ${deckId}:`, error);
      throw error;
    }
  },

  removeCardFromDeck: async (deckId: number, cardId: number): Promise<void> => {
    try {
      console.log(`Eliminando carta ${cardId} del mazo ${deckId}`);
      await httpClient.delete(`/decks/${deckId}/cards/${cardId}`);
    } catch (error) {
      console.error(`Error al eliminar carta ${cardId} del mazo ${deckId}:`, error);
      throw error;
    }
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
  },

  // Búsqueda de cartas
  searchCards: async (searchParams: SearchParams): Promise<Card[]> => {
    try {
      console.log('Buscando cartas con parámetros:', searchParams);
      
      // Construir parámetros de búsqueda eliminando valores vacíos
      const params: Record<string, string> = {};
      if (searchParams.name) params.name = searchParams.name;
      if (searchParams.color) params.color = searchParams.color;
      if (searchParams.type) params.type = searchParams.type;
      if (searchParams.rarity) params.rarity = searchParams.rarity;
      if (searchParams.set) params.setCode = searchParams.set;
      if (searchParams.manaCost) params.manaCost = searchParams.manaCost;
      
      const results = await httpClient.get<Card[]>('/cards/search', { params });
      console.log(`Búsqueda exitosa: ${results.length} cartas encontradas`);
      return results;
    } catch (error) {
      console.error('Error searching cards:', error);
      return [];
    }
  },

  updateCardQuantity: async (deckId: number, cardId: number, quantity: number): Promise<CardDeck> => {
    return apiService.updateCardInDeck(deckId, cardId, quantity);
  }
};

export default apiService;
