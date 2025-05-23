import { httpClient } from './httpClient';
import authService from './authService';
import { SetMtg, Card, Deck, DeckCreateDto, CardDeck, User, UserCollectionCard } from './types';
import { SearchParams } from '../components/SearchBar';

// Función helper para construir la ruta de API correctamente
function apiPath(path: string): string {
  // Si la ruta ya comienza con /api/, no añadir el prefijo nuevamente
  if (path.startsWith('/api/')) {
    console.log(`Ruta ya contiene prefijo /api/, manteniendo: ${path}`);
    return path;
  }
  
  // No usar API_BASE_URL aquí ya que esto sólo construye la ruta relativa
  // httpClient.ts ya maneja la base URL completa
  
  // Asegurar que la ruta comience con /api/
  // Eliminar la barra inicial si existe para evitar duplicar barras
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const result = `/api/${cleanPath}`;
  console.log(`Ruta normalizada: ${path} → ${result}`);
  
  return result;
}

// Servicio para operaciones de la API
const apiService = {
  // Sets
  getAllSets: async (): Promise<SetMtg[]> => {
    console.log('Requesting all sets');
    return httpClient.get<SetMtg[]>(apiPath('/sets'));
  },

  getSetById: async (id: number): Promise<SetMtg> => {
    console.log(`Requesting set ${id}`);
    return httpClient.get<SetMtg>(apiPath(`/sets/${id}`));
  },

  getSetByCode: async (setCode: string): Promise<SetMtg> => {
    console.log(`Requesting set with code ${setCode}`);
    return httpClient.get<SetMtg>(apiPath(`/sets/code/${setCode}`));
  },

  getCardsBySet: async (setId: number): Promise<Card[]> => {
    console.log(`Requesting cards from set ${setId}`);
    return httpClient.get<Card[]>(apiPath(`/sets/${setId}/cards`));
  },

  // Decks
  getUserDecks: async (): Promise<Deck[]> => {
    try {
      console.log('Solicitando mazos del usuario actual');
      
      // Usar el endpoint correcto que obtiene los mazos del usuario autenticado
      const decks = await httpClient.get<Deck[]>(apiPath('/decks/current-user'));
      console.log(`Encontrados ${decks.length} mazos para el usuario actual`);
      return decks;
    } catch (error) {
      console.error('Error al obtener mazos del usuario:', error);
      return [];
    }
  },

  getDeckById: async (deckId: number): Promise<Deck> => {
    console.log(`Requesting deck ${deckId}`);
    return httpClient.get<Deck>(apiPath(`/decks/${deckId}`));
  },

  getDecksByUserId: async (userId: number): Promise<Deck[]> => {
    console.log(`Requesting decks for user ${userId}`);
    return httpClient.get<Deck[]>(apiPath(`/decks/user/${userId}`));
  },

  getDecksByUsername: async (username: string): Promise<Deck[]> => {
    console.log(`Requesting decks for user ${username}`);
    return httpClient.get<Deck[]>(apiPath(`/decks/user/byUsername/${username}`));
  },

  getDecksByUserPaged: async (userId: number, page: number = 0, size: number = 20): Promise<any> => {
    console.log(`Requesting paged decks for user ${userId}, page ${page}, size ${size}`);
    return httpClient.get(apiPath(`/decks/user/${userId}/paged`), {
      params: { page, size }
    });
  },

  createDeck: async (deck: DeckCreateDto): Promise<Deck> => {
    console.log('Creating deck:', deck);
    try {
      // Verificar si el usuario está autenticado antes de intentar crear un mazo
      if (!authService.isAuthenticated()) {
        console.error('No se puede crear un mazo sin autenticación');
        throw new Error('Authentication required to create a deck');
      }
      
      // Asegurarse de que los campos requeridos están presentes
      if (!deck.deckName) {
        console.error('No se puede crear un mazo sin nombre');
        throw new Error('Deck name is required');
      }
      
      // Establecer gameType por defecto si no se proporciona
      if (!deck.gameType) {
        console.log('No se especificó tipo de juego, usando STANDARD por defecto');
        deck.gameType = 'STANDARD';
      }
      
      // Realizar la petición para crear el mazo
      const createdDeck = await httpClient.post<Deck>(apiPath('/decks'), deck);
      console.log('Mazo creado exitosamente:', createdDeck);
      return createdDeck;
    } catch (error: any) {
      console.error('Error al crear mazo:', error);
      
      // Propagar error con información más útil
      if (error.response) {
        const status = error.response.status;
        if (status === 401 || status === 403) {
          throw new Error('No tienes permisos para crear mazos. Por favor, inicia sesión de nuevo.');
        } else if (status === 400) {
          throw new Error('Datos de mazo inválidos. Verifica el nombre y tipo de juego.');
        } else {
          throw new Error(`Error del servidor (${status}): ${error.response.data?.message || 'Error desconocido'}`);
        }
      }
      
      throw error; // Re-lanzar el error original si no se puede manejar específicamente
    }
  },
  
  updateDeck: async (deckId: number, deck: Partial<Deck>): Promise<Deck> => {
    console.log(`Updating deck ${deckId}:`, deck);
    return httpClient.put<Deck>(apiPath(`/decks/${deckId}`), deck);
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
          const cards = await httpClient.get<CardDeck[]>(apiPath(`/decks/${deckId}/cards`));
          console.log(`Retrieved ${cards.length} cards for deck ${deckId}`);
          // Log para depuración - Mostrar nCopies de cada carta
          cards.forEach(card => {
            console.log(`Card ${card.cardName} (ID: ${card.cardId}) has ${card.nCopies} copies`);
          });
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
      console.error('Error getting cards from deck:', error);
      return [];
    }
  },

  // Add a card to a deck
  addCardToDeck: async (deckId: number, cardId: number): Promise<CardDeck> => {
    console.log(`Adding card ${cardId} to deck ${deckId}`);
    return httpClient.post<CardDeck>(apiPath(`/decks/${deckId}/cards/${cardId}`), {});
  },

  // Update card quantity in a deck
  updateCardInDeck: async (deckId: number, cardId: number, quantity: number): Promise<CardDeck> => {
    console.log(`Updating card ${cardId} in deck ${deckId} with quantity ${quantity}`);
    // Enviar quantity como parámetro de consulta (query parameter) en lugar de en el cuerpo
    return httpClient.put<CardDeck>(apiPath(`/decks/${deckId}/cards/${cardId}`), {}, {
      params: { quantity }
    });
  },

  // Remove a card from a deck
  removeCardFromDeck: async (deckId: number, cardId: number): Promise<void> => {
    console.log(`Removing card ${cardId} from deck ${deckId}`);
    await httpClient.delete(apiPath(`/decks/${deckId}/cards/${cardId}`));
  },

  // Get information about a specific card in a deck
  getCardDeckInfo: async (deckId: number, cardId: number): Promise<CardDeck> => {
    console.log(`Getting info for card ${cardId} in deck ${deckId}`);
    return httpClient.get<CardDeck>(apiPath(`/decks/${deckId}/cards/${cardId}`));
  },

  // Get the quantity of a specific card in a deck
  getCardQuantityInDeck: async (deckId: number, cardId: number): Promise<number> => {
    console.log(`Getting quantity for card ${cardId} in deck ${deckId}`);
    return httpClient.get<number>(apiPath(`/decks/${deckId}/cards/${cardId}/quantity`));
  },

  // User Collection
  getUserCollection: async (): Promise<UserCollectionCard[]> => {
    try {
      console.log('Requesting user collection');
      
      // Usar el endpoint simplificado que obtiene las cartas de la colección del usuario autenticado
      const data = await httpClient.get<UserCollectionCard[]>(apiPath('/collections/current-user/cards'));
      console.log(`Collection cards found: ${data.length}`);
      return data;
    } catch (error) {
      console.error('Error fetching user collection:', error);
      return [];
    }
  },

  // ===== COLLECTION MANAGEMENT =====
  createCollection: async (collectionData: any): Promise<any> => {
    try {
      console.log('Creating new collection:', collectionData);
      return httpClient.post(apiPath('/collections'), collectionData);
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  },

  getCollectionById: async (collectionId: number): Promise<any> => {
    try {
      console.log(`Getting collection ${collectionId}`);
      return httpClient.get(apiPath(`/collections/${collectionId}`));
    } catch (error) {
      console.error(`Error getting collection ${collectionId}:`, error);
      throw error;
    }
  },

  getCollectionByUserId: async (userId: number): Promise<any> => {
    try {
      console.log(`Getting collection for user ${userId}`);
      return httpClient.get(apiPath(`/collections/user/${userId}`));
    } catch (error) {
      console.error(`Error getting collection for user ${userId}:`, error);
      throw error;
    }
  },

  getCurrentUserCollection: async (): Promise<any> => {
    try {
      console.log('Getting current user collection');
      return httpClient.get(apiPath('/collections/user/current'));
    } catch (error) {
      console.error('Error getting current user collection:', error);
      throw error;
    }
  },

  getCollectionCards: async (collectionId: number): Promise<UserCollectionCard[]> => {
    try {
      console.log(`Getting cards for collection ${collectionId}`);
      return httpClient.get<UserCollectionCard[]>(apiPath(`/collections/${collectionId}/cards`));
    } catch (error) {
      console.error(`Error getting cards for collection ${collectionId}:`, error);
      throw error;
    }
  },

  updateCollection: async (collectionId: number, collectionData: any): Promise<any> => {
    try {
      console.log(`Updating collection ${collectionId}:`, collectionData);
      return httpClient.put(apiPath(`/collections/${collectionId}`), collectionData);
    } catch (error) {
      console.error(`Error updating collection ${collectionId}:`, error);
      throw error;
    }
  },

  deleteCollection: async (collectionId: number): Promise<void> => {
    try {
      console.log(`Deleting collection ${collectionId}`);
      await httpClient.delete(apiPath(`/collections/${collectionId}`));
    } catch (error) {
      console.error(`Error deleting collection ${collectionId}:`, error);
      throw error;
    }
  },

  getTotalCardsInCollection: async (collectionId: number): Promise<number> => {
    try {
      console.log(`Getting total cards for collection ${collectionId}`);
      return httpClient.get<number>(apiPath(`/collections/${collectionId}/total-cards`));
    } catch (error) {
      console.error(`Error getting total cards for collection ${collectionId}:`, error);
      throw error;
    }
  },

  // Add or update a card in the user's collection
  updateCardInCollection: async (cardId: number, copies: number): Promise<UserCollectionCard> => {
    try {
      console.log(`Updating card ${cardId} in collection with ${copies} copies`);
      
      // Usar el endpoint para agregar/actualizar carta en la colección del usuario actual
      const data = await httpClient.put<UserCollectionCard>(
        apiPath(`/collection/cards/${cardId}`), 
        {},
        { params: { quantity: copies } }
      );
      console.log(`Card updated in collection`);
      return data;
    } catch (error) {
      console.error(`Error updating card ${cardId} in collection:`, error);
      throw error;
    }
  },

  // ===== USER MANAGEMENT =====
  getUserByUsername: async (username: string): Promise<User> => {
    try {
      console.log(`Requesting user ${username}`);
      return httpClient.get<User>(apiPath(`/users/username/${username}`));
    } catch (error) {
      console.error(`Error getting user by username ${username}:`, error);
      throw error;
    }
  },

  getCurrentUserProfile: async (): Promise<User> => {
    try {
      console.log('Requesting current user profile');
      return httpClient.get<User>(apiPath('/users/me'));
    } catch (error) {
      console.error('Error getting current user profile:', error);
      throw error;
    }
  },

  updateUserProfile: async (username: string, userData: Partial<User>): Promise<User> => {
    try {
      console.log(`Updating profile for user ${username}:`, userData);
      return httpClient.put<User>(apiPath(`/users/username/${username}`), userData);
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
      if (searchParams.type) params.cardType = searchParams.type;
      if (searchParams.rarity) params.rarity = searchParams.rarity;
      if (searchParams.set) params.setCode = searchParams.set;
      
      // Manejar el costo de maná adecuadamente
      if (searchParams.manaCost) {
        // Si el valor es "8+", establecer manaCostMin=8 sin manaCostMax
        if (searchParams.manaCost === "8+") {
          params.manaCostMin = "8";
        } 
        // De lo contrario, usar el valor tanto para min como max para buscar exactamente ese valor
        else {
          params.manaCostMin = searchParams.manaCost;
          params.manaCostMax = searchParams.manaCost;
        }
      }
      
      const results = await httpClient.get<Card[]>(apiPath('/cards/search'), { params });
      console.log(`Search successful: ${results.length} cards found`);
      return results;
    } catch (error) {
      console.error('Error searching cards:', error);
      return [];
    }
  },

  updateCardQuantity: async (deckId: number, cardId: number, quantity: number): Promise<CardDeck> => {
    return apiService.updateCardInDeck(deckId, cardId, quantity);
  },

  updateDeckColor: async (deckId: number): Promise<Deck> => {
    try {
      console.log(`Actualizando color del mazo ${deckId} basado en sus cartas`);
      return httpClient.get<Deck>(apiPath(`/decks/${deckId}/update-color`));
    } catch (error) {
      console.error(`Error actualizando el color del mazo ${deckId}:`, error);
      throw error;
    }
  },

  // Funciones administrativas
  
  // Usuarios
  getAllUsers: async (): Promise<User[]> => {
    try {
      console.log('Requesting all users from the backend');
      const response = await httpClient.get<User[]>(apiPath('/users'));
      
      // Verificar que tenemos datos válidos
      if (response === null || response === undefined) {
        console.error('Respuesta nula o indefinida al obtener usuarios');
        return [];
      }
      
      if (!Array.isArray(response)) {
        console.error('Respuesta inesperada al obtener usuarios (no es un array):', response);
        return [];
      }
      
      console.log('Users received:', response);
      return response;
    } catch (error) {
      console.error('Error retrieving users:', error);
      throw error;
    }
  },

  createUser: async (userData: any): Promise<User> => {
    try {
      console.log('Creating user with data:', userData);
      
      // Ensure we're sending data in the format expected by the backend (UserCreateDto)
      const createDto = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName
      };
      
      console.log('Formatted data for backend:', createDto);
      
      // Usar httpClient para mantener consistencia con el resto de peticiones
      const response = await httpClient.post<User>(apiPath('/users'), createDto);
      
      console.log('User created successfully:', response);
      return response;
    } catch (error: any) {
      if (error.response) {
        console.error('Error from server:', error.response.status, error.response.data);
        throw new Error(error.response.data.message || `Error del servidor: ${error.response.status}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw new Error('No se recibió respuesta del servidor');
      } else {
        console.error('Error creating user:', error.message);
        throw error;
      }
    }
  },

  updateUser: async (userId: number, userData: any): Promise<User> => {
    try {
      console.log(`Updating user ${userId} with data:`, userData);
      // Ensure we're sending data in the format expected by the backend (UserDto)
      // The backend expects UserDto with userId, not id
      const userDto = {
        userId: userId, // Make sure we're using the proper field name
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName
      };
      console.log('Formatted data for backend:', userDto);
      const response = await httpClient.put<User>(apiPath(`/users/${userId}`), userDto);
      console.log('User updated successfully:', response);
      return response;
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  },

  deleteUser: async (userId: number): Promise<void> => {
    try {
      console.log(`Deleting user with ID: ${userId}`);
      await httpClient.delete(apiPath(`/users/${userId}`));
      console.log(`User ${userId} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  },

  // User Role Management
  getUserRoles: async (userId: number): Promise<string[]> => {
    try {
      console.log(`Getting roles for user ${userId}`);
      const response = await httpClient.get<string[]>(apiPath(`/users/${userId}/roles`));
      console.log(`Roles for user ${userId}:`, response);
      return response;
    } catch (error) {
      console.error(`Error getting roles for user ${userId}:`, error);
      throw error;
    }
  },

  assignRolesToUser: async (userId: number, roles: string[]): Promise<any> => {
    try {
      console.log(`Assigning roles ${roles} to user ${userId}`);
      const roleUpdateDto = { roles };
      const response = await httpClient.post(apiPath(`/users/${userId}/roles`), roleUpdateDto);
      console.log(`Roles assigned successfully to user ${userId}:`, response);
      return response;
    } catch (error) {
      console.error(`Error assigning roles to user ${userId}:`, error);
      throw error;
    }
  },

  removeRoleFromUser: async (userId: number, roleName: string): Promise<void> => {
    try {
      console.log(`Removing role ${roleName} from user ${userId}`);
      await httpClient.delete(apiPath(`/users/${userId}/roles/${roleName}`));
      console.log(`Role ${roleName} removed from user ${userId}`);
    } catch (error) {
      console.error(`Error removing role from user ${userId}:`, error);
      throw error;
    }
  },

  // Sets
  createSet: async (setData: Partial<SetMtg>): Promise<SetMtg> => {
    try {
      return httpClient.post<SetMtg>(apiPath('/sets'), setData);
    } catch (error) {
      console.error('Error creando set:', error);
      throw error;
    }
  },

  updateSet: async (setId: number, setData: Partial<SetMtg>): Promise<SetMtg> => {
    try {
      return httpClient.put<SetMtg>(apiPath(`/sets/${setId}`), setData);
    } catch (error) {
      console.error(`Error actualizando set ${setId}:`, error);
      throw error;
    }
  },

  deleteSet: async (setId: number): Promise<void> => {
    try {
      await httpClient.delete(apiPath(`/sets/${setId}`));
    } catch (error) {
      console.error(`Error eliminando set ${setId}:`, error);
      throw error;
    }
  },

  // Cartas
  getAllCards: async (): Promise<Card[]> => {
    try {
      console.log('Requesting all cards...');
      
      // Get all cards without pagination parameters
      const cards = await httpClient.get<Card[]>(apiPath('/cards'));
      
      console.log(`Received ${cards.length} cards from server`);
      
      // If there are cards, get all sets to enrich the data
      if (cards && cards.length > 0) {
        try {
          console.log("Getting sets to enrich card data...");
          
          // Get all sets
          const sets = await httpClient.get<SetMtg[]>(apiPath('/sets'));
          console.log(`Received ${sets.length} sets from server`);
          
          // Create a map of sets by ID for quick lookup
          const setsMap = new Map<number, SetMtg>();
          sets.forEach(set => {
            // Make sure the set has id/setId
            const setId = set.id || set.setId;
            if (setId) {
              setsMap.set(setId, set);
              // Ensure compatibility aliases
              set.id = setId;
              set.code = set.code || set.setCode;
              console.log(`Mapped set: ID=${setId}, Name=${set.name}, Code=${set.code}`);
            }
          });
          
          // Enrich each card with its set data
          const enrichedCards = cards.map(card => {
            console.log(`Processing card: ID=${card.cardId}, Name=${card.name}, SetID=${card.setId}`);
            
            const cardSet = card.setId ? setsMap.get(card.setId) : null;
            if (cardSet) {
              console.log(`Set found for card ${card.name}: ${cardSet.name}`);
            } else if (card.setId) {
              console.log(`⚠️ No set found with ID=${card.setId} for card ${card.name}`);
            } else {
              console.log(`Card ${card.name} has no setId assigned`);
            }
            
            return {
              ...card,
              setName: cardSet?.name || 'Unknown Set',
              setCode: cardSet?.code || 'UNK'
            };
          });
          
          console.log("Card processing completed");
          return enrichedCards;
        } catch (error) {
          console.error('Error getting sets to enrich cards:', error);
          // If getting sets fails, return cards without enrichment
          return cards;
        }
      }
      
      return cards;
    } catch (error) {
      console.error('Error getting all cards:', error);
      return [];
    }
  },

  createCard: async (cardData: Partial<Card>): Promise<Card> => {
    try {
      return httpClient.post<Card>(apiPath('/cards'), cardData);
    } catch (error) {
      console.error('Error creando carta:', error);
      throw error;
    }
  },

  updateCard: async (cardId: number, cardData: Partial<Card>): Promise<Card> => {
    try {
      console.log(`Actualizando carta con ID ${cardId}, datos:`, JSON.stringify(cardData, null, 2));
      const response = await httpClient.put<Card>(apiPath(`/cards/${cardId}`), cardData);
      console.log(`Carta ${cardId} actualizada con éxito. Respuesta:`, response);
      return response;
    } catch (error) {
      console.error(`Error actualizando carta ${cardId}:`, error);
      throw error;
    }
  },

  deleteCard: async (cardId: number): Promise<void> => {
    try {
      await httpClient.delete(apiPath(`/cards/${cardId}`));
    } catch (error) {
      console.error(`Error eliminando carta ${cardId}:`, error);
      throw error;
    }
  },

  // Mazos (funciones administrativas)
  getAllDecks: async (): Promise<Deck[]> => {
    try {
      return httpClient.get<Deck[]>(apiPath('/decks/admin'));
    } catch (error) {
      console.error('Error obteniendo todos los mazos:', error);
      return [];
    }
  },

  deleteDeck: async (deckId: number): Promise<void> => {
    try {
      await httpClient.delete(apiPath(`/decks/${deckId}`));
    } catch (error) {
      console.error(`Error eliminando mazo ${deckId}:`, error);
      throw error;
    }
  },

  // Import cards from JSON file
  importCardsFromFile: async (file: File): Promise<any> => {
    try {
      console.log('Uploading card JSON file:', file.name);
      
      // Create FormData object for file upload
      const formData = new FormData();
      formData.append('file', file);

      const response = await httpClient.post(apiPath('/admin/cards/import'), formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Cards imported successfully:', response);
      return response;
    } catch (error) {
      console.error('Error importing cards:', error);
      throw error;
    }
  }
};

export { apiService };
export default apiService;
