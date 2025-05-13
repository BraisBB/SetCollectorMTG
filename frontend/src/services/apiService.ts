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

// Definir el tipo para el objeto api para evitar errores de tipo
interface ApiService {
  getAllSets: () => Promise<SetMtg[]>;
  getSetById: (id: number) => Promise<SetMtg>;
  getCardsBySet: (setId: number) => Promise<Card[]>;
  getUserDecks: (userId?: number) => Promise<Deck[]>;
  getDeckById: (deckId: number) => Promise<Deck>;
  createDeck: (deckData: DeckCreateDto) => Promise<Deck>;
  updateDeck: (deckId: number, deckData: Deck) => Promise<Deck>;
  deleteDeck: (deckId: number) => Promise<void>;
  getCardsInDeck: (deckId: number) => Promise<CardDeck[]>;
  addCardToDeck: (deckId: number, cardId: number, quantity?: number) => Promise<CardDeck>;
  updateCardQuantity: (deckId: number, cardId: number, quantity: number) => Promise<CardDeck>;
  removeCardFromDeck: (deckId: number, cardId: number) => Promise<void>;
  getAllCards: () => Promise<Card[]>;
  getCardById: (id: number) => Promise<Card>;
  getUserProfile: (username: string) => Promise<User>;
  updateUserProfile: (username: string, userData: Partial<User>) => Promise<User>;
}

const api: ApiService = {
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
      
      // Usando la URL completa para evitar problemas con el proxy
      const url = `http://localhost:8080/decks/user/${userId}`;
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
      
      // Para desarrollo, devolvemos datos simulados
      console.log('Returning mock decks for development');
      return [
        {
          deckId: 1,
          deckName: 'Sample Deck 1',
          gameType: 'STANDARD',
          deckColor: 'Blue',
          totalCards: 60,
          userId: userIdForMocks
        },
        {
          deckId: 2,
          deckName: 'Sample Deck 2',
          gameType: 'COMMANDER',
          deckColor: 'Red',
          totalCards: 100,
          userId: userIdForMocks
        }
      ];
    }
  },

  getDeckById: async (deckId: number): Promise<Deck> => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('getDeckById: No authentication token available');
        throw new Error('No authentication token available');
      }
      
      console.log(`Requesting deck ${deckId} with token: ${token.substring(0, 15)}...`);
      
      const response = await axios.get<Deck>(`http://localhost:8080/decks/${deckId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log(`Successfully retrieved deck ${deckId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching deck ${deckId}:`, error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      throw error;
    }
  },

  createDeck: async (deckData: DeckCreateDto): Promise<Deck> => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('createDeck: No authentication token available');
        throw new Error('No authentication token available');
      }
      
      // Obtener el ID del usuario actual
      const userId = authService.getUserId();
      if (userId === null) {
        console.error('createDeck: Could not determine user ID');
        throw new Error('Could not determine user ID');
      }
      
      console.log(`Creating deck for user ${userId} with token: ${token.substring(0, 15)}...`);
      
      const response = await axios.post<Deck>(`http://localhost:8080/decks`, {
        ...deckData,
        userId: userId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Successfully created deck with ID ${response.data.deckId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error creating deck:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      throw error;
    }
  },

  updateDeck: async (deckId: number, deckData: Deck): Promise<Deck> => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('updateDeck: No authentication token available');
        throw new Error('No authentication token available');
      }
      
      console.log(`Updating deck ${deckId} with token: ${token.substring(0, 15)}...`);
      
      const response = await axios.put<Deck>(`http://localhost:8080/decks/${deckId}`, deckData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Successfully updated deck ${deckId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating deck ${deckId}:`, error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      throw error;
    }
  },

  deleteDeck: async (deckId: number): Promise<void> => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('deleteDeck: No authentication token available');
        throw new Error('No authentication token available');
      }
      
      console.log(`Deleting deck ${deckId} with token: ${token.substring(0, 15)}...`);
      
      await axios.delete(`http://localhost:8080/decks/${deckId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log(`Successfully deleted deck ${deckId}`);
    } catch (error: any) {
      console.error(`Error deleting deck ${deckId}:`, error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
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
      
      throw error;
    }
  },

  // Cards in Deck
  getCardsInDeck: async (deckId: number): Promise<CardDeck[]> => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('getCardsInDeck: No authentication token available');
        throw new Error('No authentication token available');
      }
      
      console.log(`Requesting cards for deck ${deckId} with token: ${token.substring(0, 15)}...`);
      
      const response = await axios.get<CardDeck[]>(`http://localhost:8080/decks/${deckId}/cards`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log(`Successfully retrieved ${response.data.length} cards for deck ${deckId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching cards for deck ${deckId}:`, error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
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
      
      // Devolvemos un array vacío en caso de error
      return [];
    }
  },

  addCardToDeck: async (deckId: number, cardId: number, quantity: number = 1): Promise<CardDeck> => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('addCardToDeck: No authentication token available');
        throw new Error('No authentication token available');
      }
      
      console.log(`Adding card ${cardId} to deck ${deckId} (${quantity} copies) with token: ${token.substring(0, 15)}...`);
      
      const response = await axios.post<CardDeck>(`http://localhost:8080/decks/${deckId}/cards/${cardId}?quantity=${quantity}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Successfully added card ${cardId} to deck ${deckId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error adding card ${cardId} to deck ${deckId}:`, error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
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
      
      throw error;
    }
  },

  updateCardQuantity: async (deckId: number, cardId: number, quantity: number): Promise<CardDeck> => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('updateCardQuantity: No authentication token available');
        throw new Error('No authentication token available');
      }
      
      console.log(`Updating card ${cardId} quantity to ${quantity} in deck ${deckId} with token: ${token.substring(0, 15)}...`);
      
      const response = await axios.put<CardDeck>(`http://localhost:8080/decks/${deckId}/cards/${cardId}?quantity=${quantity}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Successfully updated card ${cardId} quantity in deck ${deckId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating card ${cardId} quantity in deck ${deckId}:`, error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
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
      
      throw error;
    }
  },

  removeCardFromDeck: async (deckId: number, cardId: number): Promise<void> => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('removeCardFromDeck: No authentication token available');
        throw new Error('No authentication token available');
      }
      
      console.log(`Removing card ${cardId} from deck ${deckId} with token: ${token.substring(0, 15)}...`);
      
      await axios.delete(`http://localhost:8080/decks/${deckId}/cards/${cardId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log(`Successfully removed card ${cardId} from deck ${deckId}`);
    } catch (error: any) {
      console.error(`Error removing card ${cardId} from deck ${deckId}:`, error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
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
      
      throw error;
    }
  },

  // Cards
  getAllCards: async (): Promise<Card[]> => {
    try {
      const response = await axios.get<Card[]>(`${API_URL}/cards`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching all cards:', error);
      return [];
    }
  },

  getCardById: async (id: number): Promise<Card> => {
    try {
      const response = await axios.get<Card>(`${API_URL}/cards/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching card ${id}:`, error);
      throw error;
    }
  },

  // Users
  getUserProfile: async (username: string): Promise<User> => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('getUserProfile: No authentication token available');
        throw new Error('No authentication token available');
      }
      
      console.log(`Requesting user profile for ${username} with token: ${token.substring(0, 15)}...`);
      
      const response = await axios.get<User>(`${API_URL}/users/username/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log(`Successfully retrieved profile for user ${username}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching profile for user ${username}:`, error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      // Simulamos datos para desarrollo mientras el backend se completa
      console.log('Returning mock user profile for development');
      return {
        username: username,
        email: `${username.toLowerCase()}@example.com`,
        firstName: username,
        lastName: 'User'
      };
    }
  },

  updateUserProfile: async (username: string, userData: Partial<User>): Promise<User> => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('updateUserProfile: No authentication token available');
        throw new Error('No authentication token available');
      }
      
      console.log(`Updating profile for user ${username} with token: ${token.substring(0, 15)}...`);
      
      const response = await axios.put<User>(`${API_URL}/users/username/${username}`, userData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Successfully updated profile for user ${username}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating profile for user ${username}:`, error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      // Simulamos una respuesta exitosa para desarrollo mientras el backend se completa
      console.log('Returning mock updated user profile for development');
      return {
        username: username,
        email: userData.email || `${username.toLowerCase()}@example.com`,
        firstName: userData.firstName || username,
        lastName: userData.lastName || 'User'
      };
    }
  }
};

export default api;
