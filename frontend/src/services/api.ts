/**
 * @deprecated This file is deprecated. Please import from './apiService.ts' instead.
 * This file is kept for backward compatibility but will be removed in a future version.
 */

import axios from 'axios';
import authService from './authService';

// Usando el proxy configurado en vite.config.ts
const API_URL = '/api';

export interface SetMtg {
  setId: number;
  name: string;
  setCode: string;
  totalCards: number;
  releaseDate: string;
}

export interface Card {
  cardId: number;
  name: string;
  rarity: string;
  manaValue: number;
  manaCost: string;
  cardType: string;
  imageUrl: string;
  setId: number;
}

export interface User {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface Deck {
  deckId: number;
  deckName: string;
  gameType: string; // STANDARD, COMMANDER, etc.
  deckColor: string;
  totalCards: number;
  userId: number;
}

export interface CardDeck {
  deckId: number;
  cardId: number;
  nCopies: number;
  cardName: string;
  cardImageUrl: string;
  cardType: string;
  manaCost: string;
}

export interface DeckCreateDto {
  deckName: string;
  gameType: string;
  deckColor: string;
}

const api = {
  // Sets
  getAllSets: async (): Promise<SetMtg[]> => {
    const response = await axios.get<SetMtg[]>(`${API_URL}/sets`);
    return response.data;
  },

  getSetById: async (id: number): Promise<SetMtg> => {
    const response = await axios.get<SetMtg>(`${API_URL}/sets/${id}`);
    return response.data;
  },

  getCardsBySet: async (setId: number): Promise<Card[]> => {
    const response = await axios.get<Card[]>(`${API_URL}/sets/${setId}/cards`);
    return response.data;
  },

  // Decks
  getUserDecks: async (userId?: number): Promise<Deck[]> => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('getUserDecks: No authentication token available');
        throw new Error('No authentication token available');
      }
      
      // Si no se proporciona userId, intentamos obtenerlo del token JWT
      if (userId === undefined) {
        const userIdFromToken = authService.getUserId();
        if (userIdFromToken === null) {
          console.error('getUserDecks: Could not determine user ID');
          throw new Error('Could not determine user ID');
        }
        userId = userIdFromToken;
      }
      
      console.log(`Requesting user decks for user ${userId} with token: ${token.substring(0, 15)}...`);
      
      // Según el código del backend, la ruta correcta es:
      // DeckController: @RequestMapping("/decks")
      // Método: @GetMapping("/user/{userId}")
      // La ruta completa en el backend es: /decks/user/{userId}
      // Pero necesitamos usar el proxy de Vite, que mapea /api a http://localhost:8080
      const url = `/api/decks/user/${userId}`;
      console.log(`Requesting user decks with URL: ${url}`);
      
      const response = await axios.get<Deck[]>(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log(`Successfully retrieved ${response.data.length} decks for user ${userId}`);
      return response.data;
    } catch (error: any) {
      // Intentamos obtener el userId para los datos simulados
      let userIdForMocks = userId;
      if (userIdForMocks === undefined) {
        userIdForMocks = authService.getUserId() || 1; // Usamos 1 como fallback
      }
      
      console.error(`Error fetching decks for user ${userIdForMocks}:`, error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        // Si el error es 401 o 403, podría ser un problema de autenticación
        if (error.response.status === 401 || error.response.status === 403) {
          console.warn('Authentication issue detected, checking token validity');
          if (!authService.isAuthenticated()) {
            console.error('Token is invalid or expired');
          }
        }
      } else if (error.request) {
        console.error('No response received from server');
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      console.warn('Returning mock data for development');
      
      // Datos simulados para desarrollo con estilos consistentes con la aplicación
      // Usando la fuente Palatino para títulos y Noto Sans para elementos interactivos
      const mockDecks: Deck[] = [
        {
          deckId: 1,
          deckName: 'Mazo Azul',
          gameType: 'STANDARD',
          deckColor: 'U',
          totalCards: 60,
          userId: userIdForMocks
        },
        {
          deckId: 2,
          deckName: 'Mazo Rojo',
          gameType: 'COMMANDER',
          deckColor: 'R',
          totalCards: 100,
          userId: userIdForMocks
        },
        {
          deckId: 3,
          deckName: 'Mazo Verde',
          gameType: 'MODERN',
          deckColor: 'G',
          totalCards: 60,
          userId: userIdForMocks
        }
      ];
      
      return mockDecks;
    }
  },

  getDeckById: async (deckId: number): Promise<Deck> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    try {
      const response = await axios.get<Deck>(`${API_URL}/decks/${deckId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error en getDeckById:', error);
      // Devolver un mazo vacío para desarrollo
      return {
        deckId: deckId,
        deckName: 'Mazo no encontrado',
        gameType: 'STANDARD',
        deckColor: 'U',
        totalCards: 0,
        userId: 1
      };
    }
  },

  createDeck: async (deckData: DeckCreateDto): Promise<Deck> => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('createDeck: No authentication token available');
        throw new Error('No authentication token available');
      }
      
      console.log(`Creating deck with name: ${deckData.deckName}`);
      
      // Asegurarse de que el userId está establecido correctamente
      const userIdFromToken = authService.getUserId();
      if (userIdFromToken === null) {
        console.error('createDeck: Could not determine user ID');
        throw new Error('Could not determine user ID');
      }
      
      // La ruta correcta según el backend es:
      // DeckController: @RequestMapping("/decks")
      // Método: @PostMapping
      // La ruta completa en el backend es: /decks
      const url = `/api/decks`;
      console.log(`Creating deck with URL: ${url}`);
      
      // Crear el objeto completo para enviar al backend
      const deckToCreate = {
        ...deckData,
        userId: userIdFromToken
      };
      
      const response = await axios.post<Deck>(url, deckToCreate, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Successfully created deck with ID: ${response.data.deckId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error creating deck:`, error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        // Si el error es 401 o 403, podría ser un problema de autenticación
        if (error.response.status === 401 || error.response.status === 403) {
          console.warn('Authentication issue detected, checking token validity');
          if (!authService.isAuthenticated()) {
            console.error('Token is invalid or expired');
          }
        }
      } else if (error.request) {
        console.error('No response received from server');
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      console.warn('Returning mock data for development');
      
      // Obtener el ID del usuario para los datos simulados
      // Intentamos obtener el ID del usuario nuevamente en caso de que no esté disponible en el bloque try
      const userId = authService.getUserId() || 1; // Usar 1 como fallback
      
      // Datos simulados para desarrollo
      const mockDeck: Deck = {
        deckId: Math.floor(Math.random() * 1000) + 100, // ID aleatorio para simular creación
        deckName: deckData.deckName,
        gameType: deckData.gameType,
        deckColor: deckData.deckColor,
        totalCards: 0,
        userId: userId
      };
      
      return mockDeck;
    }
  },

  updateDeck: async (deckId: number, deckData: Deck): Promise<Deck> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.put<Deck>(`${API_URL}/decks/${deckId}`, deckData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  deleteDeck: async (deckId: number): Promise<void> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    await axios.delete(`${API_URL}/decks/${deckId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Cards in Deck
  getCardsInDeck: async (deckId: number): Promise<CardDeck[]> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.get<CardDeck[]>(`${API_URL}/decks/${deckId}/cards`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  addCardToDeck: async (deckId: number, cardId: number, quantity: number = 1): Promise<CardDeck> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.post<CardDeck>(`${API_URL}/decks/${deckId}/cards/${cardId}?quantity=${quantity}`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  updateCardQuantity: async (deckId: number, cardId: number, quantity: number): Promise<CardDeck> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.put<CardDeck>(`${API_URL}/decks/${deckId}/cards/${cardId}?quantity=${quantity}`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  removeCardFromDeck: async (deckId: number, cardId: number): Promise<void> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    await axios.delete(`${API_URL}/decks/${deckId}/cards/${cardId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Cards
  getAllCards: async (): Promise<Card[]> => {
    const response = await axios.get<Card[]>(`${API_URL}/cards`);
    return response.data;
  },

  getCardById: async (id: number): Promise<Card> => {
    const response = await axios.get<Card>(`${API_URL}/cards/${id}`);
    return response.data;
  },

  // Users
  getUserProfile: async (username: string): Promise<User> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    try {
      const response = await axios.get<User>(`${API_URL}/users/username/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error in getUserProfile API call:', error);
      // Simulamos datos para desarrollo mientras el backend se completa
      return {
        username: username,
        email: `${username.toLowerCase()}@example.com`,
        firstName: username,
        lastName: 'User'
      };
    }
  },

  updateUserProfile: async (username: string, userData: Partial<User>): Promise<User> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    try {
      const response = await axios.put<User>(`${API_URL}/users/username/${username}`, userData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error in updateUserProfile API call:', error);
      // Simulamos una respuesta exitosa para desarrollo mientras el backend se completa
      return {
        username: username,
        email: userData.email || `${username.toLowerCase()}@example.com`,
        firstName: userData.firstName || username,
        lastName: userData.lastName || 'User'
      };
    }
  }
};