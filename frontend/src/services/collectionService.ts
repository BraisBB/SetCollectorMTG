import { httpClient } from './httpClient';
import { UserCollectionCard, UserCollection } from './types';

// Helper function to build API path correctly
function apiPath(path: string): string {
  if (path.startsWith('/api/')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `/api/${cleanPath}`;
}

// Servicio para gestionar la colección de cartas del usuario
class CollectionService {
  /**
   * Obtiene la cantidad de una carta en la colección del usuario
   */
  async getCardInCollection(cardId: number): Promise<number> {
    try {
      console.log(`Solicitando cantidad de carta ${cardId} en colección`);
      const quantity = await httpClient.get<number>(apiPath(`/collection/cards/${cardId}/quantity`));
      console.log(`Cantidad de carta ${cardId} recibida: ${quantity}`);
      return quantity;
    } catch (error) {
      console.error(`Error al obtener información de la carta ${cardId} en la colección:`, error);
      // Si la carta no existe en la colección, devolvemos 0
      return 0;
    }
  }

  /**
   * Añade una carta a la colección del usuario
   */
  async addCardToCollection(cardId: number, quantity: number): Promise<UserCollectionCard> {
    try {
      console.log(`Añadiendo carta ${cardId} a la colección (${quantity} copias)`);
      const result = await httpClient.post<UserCollectionCard>(
        apiPath(`/collection/cards/${cardId}`),
        {}, // Cuerpo vacío, ya que usamos el parámetro quantity
        { params: { quantity } } // Usar params de axios para añadir ?quantity=X
      );
      console.log(`Carta ${cardId} añadida correctamente:`, result);
      return result;
    } catch (error) {
      console.error(`Error al añadir carta ${cardId} a la colección:`, error);
      throw error;
    }
  }

  /**
   * Actualiza la cantidad de una carta en la colección
   */
  async updateCardQuantity(cardId: number, quantity: number): Promise<UserCollectionCard> {
    try {
      console.log(`Actualizando cantidad de carta ${cardId} a ${quantity}`);
      const result = await httpClient.put<UserCollectionCard>(
        apiPath(`/collection/cards/${cardId}`),
        {}, // Cuerpo vacío
        { params: { quantity } } // Usar params para ?quantity=X
      );
      console.log(`Cantidad de carta ${cardId} actualizada a ${quantity}`);
      return result;
    } catch (error) {
      console.error(`Error al actualizar cantidad de carta ${cardId}:`, error);
      throw error;
    }
  }

  /**
   * Elimina una carta de la colección
   */
  async removeCardFromCollection(cardId: number): Promise<void> {
    try {
      console.log(`Eliminando carta ${cardId} de la colección`);
      await httpClient.delete(apiPath(`/collection/cards/${cardId}`));
      console.log(`Carta ${cardId} eliminada correctamente`);
    } catch (error) {
      console.error(`Error al eliminar carta ${cardId} de la colección:`, error);
      throw error;
    }
  }

  /**
   * Obtiene todas las cartas de la colección del usuario actual
   */
  async getUserCollectionCards(): Promise<UserCollectionCard[]> {
    try {
      console.log('Solicitando cartas de la colección del usuario actual');
      
      // Usar el endpoint directo que obtiene las cartas de la colección del usuario actual
      const cards = await httpClient.get<UserCollectionCard[]>(apiPath(`/collections/current-user/cards`));
      console.log(`${cards.length} cartas recibidas de la colección`);
      
      // Verificar la estructura de datos recibida para depuración
      if (cards.length > 0) {
        console.log('Ejemplo de la primera carta recibida:', JSON.stringify(cards[0], null, 2));
        
        // Verificar si las URLs de Scryfall son correctas
        cards.forEach((card, index) => {
          if (card.cardName) {
            console.log(`Carta ${index}: ${card.cardName}, imageUrl: ${card.cardImageUrl || 'NO TIENE IMAGEN'}`);
            
            // Si no tiene imagen o la URL es inválida, asignar URL por defecto
            if (!card.cardImageUrl || 
                card.cardImageUrl === 'null' || 
                card.cardImageUrl === 'undefined') {
              
              // Intentar generar URL alternativa basada en el ID de la carta
              console.log(`Asignando imagen por defecto a carta ${card.cardName}`);
              card.cardImageUrl = `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.cardId}&type=card`;
            } 
            // Si la URL es de Scryfall, verificar que tenga el formato correcto
            else if (card.cardImageUrl.includes('api.scryfall.com/cards/')) {
              if (!card.cardImageUrl.includes('?format=image')) {
                // Agregar parámetro format=image si no lo tiene
                console.log(`Corrigiendo URL de Scryfall para ${card.cardName}`);
                card.cardImageUrl = `${card.cardImageUrl}${card.cardImageUrl.includes('?') ? '&' : '?'}format=image`;
              }
            }
          } else {
            console.log(`Carta ${index}: No tiene nombre de carta`);
          }
        });
      }
      
      return cards;
    } catch (error) {
      console.error('Error al obtener las cartas de la colección:', error);
      // En caso de error, devolver un array vacío para evitar problemas en la UI
      return [];
    }
  }
}

export const collectionService = new CollectionService(); 