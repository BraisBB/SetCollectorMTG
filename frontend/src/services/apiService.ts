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
    console.log('Requesting all sets');
    return httpClient.get<SetMtg[]>('/sets');
  },

  getSetById: async (id: number): Promise<SetMtg> => {
    console.log(`Requesting set ${id}`);
    return httpClient.get<SetMtg>(`/sets/${id}`);
  },

  getCardsBySet: async (setId: number): Promise<Card[]> => {
    console.log(`Requesting cards from set ${setId}`);
    return httpClient.get<Card[]>(`/sets/${setId}/cards`);
  },

  // Decks
  getUserDecks: async (userId?: number): Promise<Deck[]> => {
    try {
      // Intento 1: Usar Keycloak UUID (más confiable con backends basados en Keycloak)
      const keycloakId = localStorage.getItem('user_keycloak_id');
      if (keycloakId) {
        console.log(`Intentando obtener mazos con Keycloak ID: ${keycloakId}`);
        try {
          console.log(`Llamando endpoint: /decks/user/keycloak/${keycloakId}`);
          const decks = await httpClient.get<Deck[]>(`/decks/user/keycloak/${keycloakId}`);
          
          if (Array.isArray(decks) && decks.length > 0) {
            console.log(`¡Éxito! Encontrados ${decks.length} mazos con Keycloak ID`);
            return decks;
          } else {
            console.log('No se encontraron mazos con Keycloak ID');
          }
        } catch (error) {
          console.error(`Error al obtener mazos con Keycloak ID: ${keycloakId}`, error);
        }
      }

      // Intento 2: Usar el endpoint del usuario actual
      try {
        console.log(`Intentando obtener mazos con el endpoint de usuario actual`);
        const decks = await httpClient.get<Deck[]>(`/decks/current-user`);
        
        if (Array.isArray(decks) && decks.length > 0) {
          console.log(`¡Éxito! Encontrados ${decks.length} mazos con el endpoint de usuario actual`);
          return decks;
        } else {
          console.log('No se encontraron mazos con el endpoint de usuario actual');
        }
      } catch (error) {
        console.error('Error al obtener mazos con el endpoint de usuario actual', error);
      }
      
      // Intento 3: Usar username real del usuario
      const username = localStorage.getItem('username') || '';
      if (username && username !== keycloakId) { // Asegurarse de que no sea el keycloakId
        try {
          console.log(`Intentando obtener mazos con username real: ${username}`);
          const decks = await httpClient.get<Deck[]>(`/decks/user/byUsername/${username}`);
          
          if (Array.isArray(decks) && decks.length > 0) {
            console.log(`¡Éxito! Encontrados ${decks.length} mazos con username`);
            return decks;
          } else {
            console.log('No se encontraron mazos con username');
          }
        } catch (error) {
          console.error(`Error al obtener mazos con username: ${username}`, error);
        }
      }

      // Fallback final: devolver un array vacío si todos los intentos fallan
      console.log('Todos los intentos fallaron, devolviendo array vacío');
      return [];
    } catch (error) {
      console.error('Error al obtener mazos del usuario', error);
      return [];
    }
  },

  getDeckById: async (deckId: number): Promise<Deck> => {
    try {
      console.log(`Requesting deck ${deckId}`);
      
      // Implement retry system
      const MAX_RETRIES = 3;
      let retryCount = 0;
      let lastError = null;
      
      while (retryCount < MAX_RETRIES) {
        try {
          const deck = await httpClient.get<Deck>(`/decks/${deckId}`);
          console.log(`Deck ${deckId} retrieved successfully:`, deck.deckName);
          return deck;
        } catch (error: any) {
          lastError = error;
          
          // If error is 403, it could be a permissions issue
          if (error.response && error.response.status === 403) {
            console.warn(`You don't have permission to access deck ${deckId}.`);
            // For permission errors, break the cycle and return a "not found" deck
            break;
          }
          
          // For other errors, try again after a delay
          retryCount++;
          console.log(`Retry ${retryCount}/${MAX_RETRIES} to get deck ${deckId}...`);
          
          // Wait a bit before retrying (using setTimeout with Promise)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      console.error(`Error getting deck by ID after ${MAX_RETRIES} attempts:`, lastError);
      throw new Error(`Could not retrieve deck ${deckId}`);
    } catch (error) {
      console.error('Error getting deck by ID:', error);
      throw error;
    }
  },

  createDeck: async (deckData: DeckCreateDto): Promise<Deck> => {
    try {
      // Make sure userId is set
      const userId = authService.getUserIdentifier();
      console.log("Creating deck, authenticated user ID:", userId);
      
      if (userId === null) {
        throw new Error('No se pudo determinar el ID del usuario');
      }
      
      // Create complete object to send to backend
      const deckToCreate = {
        ...deckData
      };
      
      console.log('Creating new deck with data:', deckToCreate);
      
      // Send the request
      try {
        const response = await httpClient.post<Deck>('/decks', deckToCreate);
        console.log('Deck created successfully:', response);
        return response;
      } catch (apiError: any) {
        console.error('API error creating deck:', apiError);
        if (apiError.response) {
          console.error('Response data:', apiError.response.data);
          console.error('Response status:', apiError.response.status);
        }
        throw apiError;
      }
    } catch (error) {
      console.error('Error creating deck:', error);
      throw error;
    }
  },

  updateDeck: async (deckId: number, deckData: Deck): Promise<Deck> => {
    try {
      console.log(`Updating deck ${deckId}:`, deckData);
      return httpClient.put<Deck>(`/decks/${deckId}`, deckData);
    } catch (error) {
      console.error(`Error updating deck ${deckId}:`, error);
      throw error;
    }
  },

  deleteDeck: async (deckId: number): Promise<void> => {
    try {
      console.log(`Deleting deck ${deckId}`);
      await httpClient.delete(`/decks/${deckId}`);
    } catch (error) {
      console.error(`Error deleting deck ${deckId}:`, error);
      throw error;
    }
  },

  // Cards in Deck
  getCardsByDeck: async (deckId: number): Promise<CardDeck[]> => {
    try {
      console.log(`Requesting cards from deck ${deckId}`);
      
      // Implement retry system
      const MAX_RETRIES = 3;
      let retryCount = 0;
      let lastError = null;
      
      while (retryCount < MAX_RETRIES) {
        try {
          const cards = await httpClient.get<CardDeck[]>(`/decks/${deckId}/cards`);
          console.log(`Retrieved ${cards.length} cards for deck ${deckId}`);
          return cards;
        } catch (error: any) {
          lastError = error;
          
          // If error is 404, endpoint might not exist in backend
          if (error.response && error.response.status === 404) {
            console.warn(`Endpoint /decks/${deckId}/cards not found. The backend might not have implemented this endpoint.`);
            // No point in retrying if the endpoint doesn't exist
            return [];
          }
          
          // If error is 403, it could be a permissions issue
          if (error.response && error.response.status === 403) {
            console.warn(`You don't have permissions to access deck ${deckId}.`);
            // No point in retrying for permission errors
            return [];
          }
          
          // For other errors, try again after a delay
          retryCount++;
          console.log(`Retry ${retryCount}/${MAX_RETRIES} to get cards from deck ${deckId}...`);
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      console.error(`Error getting cards from deck ${deckId} after ${MAX_RETRIES} attempts:`, lastError);
      return [];
    } catch (error) {
      console.error(`Error getting cards from deck ${deckId}:`, error);
      return [];
    }
  },

  addCardToDeck: async (deckId: number, cardId: number, quantity: number = 1): Promise<CardDeck> => {
    try {
      console.log(`Adding card ${cardId} to deck ${deckId} (${quantity} copies)`);
      return httpClient.post<CardDeck>(
        `/decks/${deckId}/cards/${cardId}`, 
        {}, 
        { params: { quantity } }
      );
    } catch (error) {
      console.error(`Error adding card ${cardId} to deck ${deckId}:`, error);
      throw error;
    }
  },

  updateCardInDeck: async (deckId: number, cardId: number, quantity: number): Promise<CardDeck> => {
    try {
      console.log(`Updating quantity of card ${cardId} in deck ${deckId} to ${quantity}`);
      return httpClient.put<CardDeck>(
        `/decks/${deckId}/cards/${cardId}`, 
        {}, 
        { params: { quantity } }
      );
    } catch (error) {
      console.error(`Error updating quantity of card ${cardId} in deck ${deckId}:`, error);
      throw error;
    }
  },

  removeCardFromDeck: async (deckId: number, cardId: number): Promise<void> => {
    try {
      console.log(`Removing card ${cardId} from deck ${deckId}`);
      await httpClient.delete(`/decks/${deckId}/cards/${cardId}`);
    } catch (error) {
      console.error(`Error removing card ${cardId} from deck ${deckId}:`, error);
      throw error;
    }
  },

  // Cards
  getAllCards: async (): Promise<Card[]> => {
    console.log('Requesting all cards');
    return httpClient.get<Card[]>('/cards');
  },

  getCardById: async (id: number): Promise<Card> => {
    console.log(`Requesting card ${id}`);
    return httpClient.get<Card>(`/cards/${id}`);
  },

  // Users
  getUserByUsername: async (username: string): Promise<User> => {
    try {
      console.log(`Requesting user ${username}`);
      return httpClient.get<User>(`/users/username/${username}`);
    } catch (error) {
      console.error(`Error getting user by username ${username}:`, error);
      throw error;
    }
  },

  updateUserProfile: async (username: string, userData: Partial<User>): Promise<User> => {
    try {
      console.log(`Updating profile for user ${username}:`, userData);
      return httpClient.put<User>(`/users/username/${username}`, userData);
    } catch (error) {
      console.error(`Error updating user profile for ${username}:`, error);
      throw error;
    }
  },

  // Card search
  searchCards: async (searchParams: SearchParams): Promise<Card[]> => {
    try {
      console.log('Searching cards with parameters:', searchParams);
      
      // Build search parameters removing empty values
      const params: Record<string, string> = {};
      if (searchParams.name) params.name = searchParams.name;
      if (searchParams.color) params.color = searchParams.color;
      if (searchParams.type) params.type = searchParams.type;
      if (searchParams.rarity) params.rarity = searchParams.rarity;
      if (searchParams.set) params.setCode = searchParams.set;
      if (searchParams.manaCost) params.manaCost = searchParams.manaCost;
      
      const results = await httpClient.get<Card[]>('/cards/search', { params });
      console.log(`Search successful: ${results.length} cards found`);
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
