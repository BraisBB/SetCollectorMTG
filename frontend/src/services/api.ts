import axios from 'axios';

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

export default api;