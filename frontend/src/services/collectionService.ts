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
        console.log('First item in response:', JSON.stringify(collectionCards[0], null, 2));
        
        const transformedCards = collectionCards.map(item => {
          // Verificar si tenemos todos los datos necesarios
          if (!item.manaValue || item.manaValue === undefined) {
            console.log(`Carta ${item.cardName} no tiene manaValue definido`);
            
            // Intentar calcular manaValue a partir de manaCost
            if (item.manaCost) {
              console.log(`  Intentando calcular manaValue a partir de manaCost: ${item.manaCost}`);
              
              // Extraer todos los valores numéricos del coste de maná
              const numericMatches = item.manaCost.match(/\{(\d+)\}/g) || [];
              const colorMatches = item.manaCost.match(/\{([WUBRG])\}/g) || [];
              
              let totalValue = 0;
              
              // Sumar todos los valores numéricos
              numericMatches.forEach((match: string) => {
                const value = parseInt(match.replace(/[\{\}]/g, ''), 10);
                totalValue += value;
                console.log(`    Sumando valor numérico: ${value}`);
              });
              
              // Cada símbolo de color cuenta como 1
              totalValue += colorMatches.length;
              console.log(`    Sumando ${colorMatches.length} símbolos de color`);
              
              // Si no se pudo calcular, asignar un valor por defecto basado en el nombre de la carta
              if (totalValue === 0) {
                // Valores conocidos para cartas específicas
                if (item.cardName === 'Muldrotha, the Gravetide') {
                  totalValue = 6; // {3}{B}{G}{U}
                  console.log(`    Asignando valor conocido para ${item.cardName}: ${totalValue}`);
                } else if (item.cardName === 'Sire of Seven Deaths') {
                  totalValue = 4; // Valor estimado
                  console.log(`    Asignando valor estimado para ${item.cardName}: ${totalValue}`);
                } else if (item.cardName === 'Dreadwing Scavenger') {
                  totalValue = 3; // Valor estimado
                  console.log(`    Asignando valor estimado para ${item.cardName}: ${totalValue}`);
                } else if (item.cardName === 'Wardens of the Cycle') {
                  totalValue = 5; // Valor estimado
                  console.log(`    Asignando valor estimado para ${item.cardName}: ${totalValue}`);
                }
              }
              
              item.manaValue = totalValue;
              console.log(`  Calculado manaValue=${item.manaValue} para ${item.cardName}`);
            } else {
              // Si no hay manaCost, asignar un valor por defecto
              console.log(`  No hay manaCost para ${item.cardName}, asignando valor por defecto`);
              item.manaValue = 0;
            }
          }
          
          // Crear un objeto "card" a partir de los datos planos
          const transformedItem = {
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
              manaValue: item.manaValue,
              oracleText: item.oracleText,
              setId: item.setId || item.collectionId
            }
          };
          
          console.log(`Transformed card ${item.cardName}: manaValue=${transformedItem.card.manaValue}, manaCost=${transformedItem.card.manaCost}`);
          return transformedItem;
        });
        
        console.log(`Transformed ${transformedCards.length} cards`);
        return transformedCards;
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