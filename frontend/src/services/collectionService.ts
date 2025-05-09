import axios from 'axios';
import authService from './authService';

const API_BASE_URL = 'http://localhost:8080';

export interface UserCollectionCard {
  cardId: number;
  collectionId: number;
  nCopies: number;
  card?: any; // Para contener los detalles completos de la carta
}

interface UserCollection {
  collectionId: number;
  userId: number;
  name: string;
}

export const collectionService = {
  // Obtener la información de una carta en la colección del usuario
  getCardInCollection: async (cardId: number): Promise<number> => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('getCardInCollection: No authentication token available');
        return 0;
      }

      console.log(`Requesting card ${cardId} collection info with token: ${token.substring(0, 15)}...`);

      const response = await axios.get<number>(
        `${API_BASE_URL}/collection/cards/${cardId}/quantity`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log(`Card ${cardId} quantity response:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching card ${cardId} in collection:`, error);
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
      }
      // Si la carta no existe en la colección, devolvemos 0
      return 0;
    }
  },

  // Añadir una carta a la colección
  addCardToCollection: async (cardId: number, quantity: number): Promise<UserCollectionCard> => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('addCardToCollection: No authentication token available');
        throw new Error('No authentication token available');
      }

      console.log(`Adding card ${cardId} to collection (${quantity} copies) with token: ${token.substring(0, 15)}...`);

      const response = await axios.post<UserCollectionCard>(
        `${API_BASE_URL}/collection/cards/${cardId}?quantity=${quantity}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`Successfully added card ${cardId} to collection:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error adding card ${cardId} to collection:`, error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
      }
      throw error;
    }
  },

  // Actualizar la cantidad de una carta en la colección
  updateCardQuantity: async (cardId: number, quantity: number): Promise<UserCollectionCard> => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('updateCardQuantity: No authentication token available');
        throw new Error('No authentication token available');
      }

      console.log(`Updating card ${cardId} quantity to ${quantity} with token: ${token.substring(0, 15)}...`);

      const response = await axios.put<UserCollectionCard>(
        `${API_BASE_URL}/collection/cards/${cardId}?quantity=${quantity}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`Successfully updated card ${cardId} quantity:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating card ${cardId} quantity:`, error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
      }
      throw error;
    }
  },

  // Eliminar una carta de la colección
  removeCardFromCollection: async (cardId: number): Promise<void> => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('removeCardFromCollection: No authentication token available');
        throw new Error('No authentication token available');
      }

      console.log(`Removing card ${cardId} from collection with token: ${token.substring(0, 15)}...`);

      await axios.delete(
        `${API_BASE_URL}/collection/cards/${cardId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log(`Successfully removed card ${cardId} from collection`);
    } catch (error: any) {
      console.error(`Error removing card ${cardId} from collection:`, error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
      }
      throw error;
    }
  },

  // Obtener todas las cartas de la colección del usuario
  getUserCollectionCards: async (): Promise<any[]> => {
    try {
      // Obtener el token de autenticación
      const token = authService.getToken();
      if (!token) {
        console.error('getUserCollectionCards: No authentication token available');
        throw new Error('No authentication token available');
      }

      console.log('Authentication token for collection request:', token ? `${token.substring(0, 15)}...` : 'Not found');

      // Primero, obtener la colección del usuario actual
      console.log('Requesting current user collection');
      const userCollectionResponse = await axios.get<UserCollection>(
        `${API_BASE_URL}/collections/user/current`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const collectionId = userCollectionResponse.data.collectionId;
      console.log('Found collection ID:', collectionId);
      
      // Luego obtener todas las cartas de esa colección
      console.log(`Requesting all cards for collection ${collectionId}`);
      const response = await axios.get<any[]>(
        `${API_BASE_URL}/collections/${collectionId}/cards`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const collectionCards = response.data;
      console.log('Collection cards response:', collectionCards);

      // Si las cartas no contienen una propiedad "card", ajustamos el formato
      // para mantener consistencia con la interfaz esperada
      if (collectionCards.length > 0 && !collectionCards[0].card) {
        console.log('Transforming flat format response to nested format');
        return collectionCards.map(item => {
          // Crear un objeto "card" a partir de los datos planos
          return {
            collectionId: item.collectionId,
            cardId: item.cardId,
            nCopies: item.ncopies || 1, // Usar ncopies si está disponible
            card: {
              cardId: item.cardId,
              name: item.cardName,
              imageUrl: item.cardImageUrl,
              cardType: item.cardType,
              rarity: item.rarity,
              manaCost: item.manaCost,
              setId: item.setId || item.collectionId
            }
          };
        });
      }
      
      return collectionCards;
    } catch (error: any) {
      console.error('Error fetching user collection cards:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.status === 401) {
          console.error('Authentication token is invalid or expired');
          // Redirigir al login podría ser una buena idea aquí
          // window.location.href = '/login';
        }
      } else if (error.request) {
        console.error('No response received from server');
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      return [];
    }
  }
};

export default collectionService; 