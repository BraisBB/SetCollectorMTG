import { httpClient } from './httpClient';
import authService from './authService';
import { SetMtg, Card, Deck, DeckCreateDto, CardDeck, User, UserCollectionCard } from './types';
import { SearchParams } from '../components/SearchBar';

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
      if (username) {
        console.log(`Intentando obtener mazos con username: ${username}`);
        try {
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
      
      // Si llegamos aquí, intentamos el enfoque original (userId numérico)
      if (userId) {
        console.log(`Intentando obtener mazos con userId: ${userId}`);
        try {
          const decks = await httpClient.get<Deck[]>(`/decks/user/${userId}`);
          
          if (Array.isArray(decks) && decks.length > 0) {
            console.log(`¡Éxito! Encontrados ${decks.length} mazos con userId`);
            return decks;
          } else {
            console.log('No se encontraron mazos con userId');
          }
        } catch (error) {
          console.error(`Error al obtener mazos con userId: ${userId}`, error);
        }
      }
      
      // Si llegamos aquí, ninguno de los enfoques funcionó
      console.warn('No se pudo obtener los mazos con ninguno de los métodos disponibles');
      return [];
    } catch (error) {
      console.error('Error general al obtener mazos del usuario:', error);
      return [];
    }
  },

  getDeckById: async (deckId: number): Promise<Deck> => {
    console.log(`Requesting deck ${deckId}`);
    return httpClient.get<Deck>(`/decks/${deckId}`);
  },

  createDeck: async (deck: DeckCreateDto): Promise<Deck> => {
    console.log('Creating deck:', deck);
    return httpClient.post<Deck>('/decks', deck);
  },
  
  updateDeck: async (deckId: number, deck: Partial<Deck>): Promise<Deck> => {
    console.log(`Updating deck ${deckId}:`, deck);
    return httpClient.put<Deck>(`/decks/${deckId}`, deck);
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
    return httpClient.post<CardDeck>(`/decks/${deckId}/cards/${cardId}`, {});
  },

  // Update card quantity in a deck
  updateCardInDeck: async (deckId: number, cardId: number, quantity: number): Promise<CardDeck> => {
    console.log(`Updating card ${cardId} in deck ${deckId} with quantity ${quantity}`);
    return httpClient.put<CardDeck>(`/decks/${deckId}/cards/${cardId}`, { nCopies: quantity });
  },

  // Remove a card from a deck
  removeCardFromDeck: async (deckId: number, cardId: number): Promise<void> => {
    console.log(`Removing card ${cardId} from deck ${deckId}`);
    await httpClient.delete(`/decks/${deckId}/cards/${cardId}`);
  },

  // User Collection
  getUserCollection: async (): Promise<UserCollectionCard[]> => {
    try {
      // Primero intentamos con el UUID de Keycloak
      const keycloakId = localStorage.getItem('user_keycloak_id');
      if (keycloakId) {
        try {
          console.log(`Requesting collection for user with Keycloak ID: ${keycloakId}`);
          const data = await httpClient.get<UserCollectionCard[]>(`/collections/user/keycloak/${keycloakId}/cards`);
          if (data && data.length > 0) {
            console.log(`Collection found with Keycloak ID. Cards: ${data.length}`);
            return data;
          }
        } catch (error) {
          console.error('Error fetching collection with Keycloak ID:', error);
        }
      }
      
      // Luego probamos con el username
      const username = localStorage.getItem('username');
      if (username) {
        try {
          console.log(`Requesting collection for user with username: ${username}`);
          const data = await httpClient.get<UserCollectionCard[]>(`/collections/user/byUsername/${username}/cards`);
          if (data && data.length > 0) {
            console.log(`Collection found with username. Cards: ${data.length}`);
            return data;
          }
        } catch (error) {
          console.error('Error fetching collection with username:', error);
        }
      }
      
      // Finalmente, probamos con el ID de usuario
      const userId = authService.getUserIdentifier();
      if (userId && userId.match(/^\d+$/)) {
        try {
          console.log(`Requesting collection for user with ID: ${userId}`);
          const data = await httpClient.get<UserCollectionCard[]>(`/collections/user/${userId}/cards`);
          console.log(`Collection found with user ID. Cards: ${data.length}`);
          return data;
        } catch (error) {
          console.error('Error fetching collection with user ID:', error);
        }
      }
      
      console.warn('Could not fetch user collection with any available method');
      return [];
    } catch (error) {
      console.error('Error fetching user collection:', error);
      return [];
    }
  },

  // Add or update a card in the user's collection
  updateCardInCollection: async (cardId: number, copies: number): Promise<UserCollectionCard> => {
    try {
      console.log(`Updating card ${cardId} in collection with ${copies} copies`);
      
      // Intentar primero con Keycloak UUID
      const keycloakId = localStorage.getItem('user_keycloak_id');
      if (keycloakId) {
        try {
          const data = await httpClient.put<UserCollectionCard>(
            `/collections/user/keycloak/${keycloakId}/cards/${cardId}`, 
            { copies }
          );
          console.log(`Card updated in collection using Keycloak ID`);
          return data;
        } catch (error) {
          console.error('Error updating card with Keycloak ID:', error);
        }
      }
      
      // Intentar con username
      const username = localStorage.getItem('username');
      if (username) {
        try {
          const data = await httpClient.put<UserCollectionCard>(
            `/collections/user/byUsername/${username}/cards/${cardId}`, 
            { copies }
          );
          console.log(`Card updated in collection using username`);
          return data;
        } catch (error) {
          console.error('Error updating card with username:', error);
        }
      }
      
      // Intentar con user ID
      const userId = authService.getUserIdentifier();
      if (userId && userId.match(/^\d+$/)) {
        const data = await httpClient.put<UserCollectionCard>(
          `/collections/user/${userId}/cards/${cardId}`, 
          { copies }
        );
        console.log(`Card updated in collection using user ID`);
        return data;
      }
      
      throw new Error('Could not update card in collection with any available method');
    } catch (error) {
      console.error(`Error updating card ${cardId} in collection:`, error);
      throw error;
    }
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
  },

  updateDeckColor: async (deckId: number): Promise<Deck> => {
    try {
      console.log(`Actualizando color del mazo ${deckId} basado en sus cartas`);
      return httpClient.get<Deck>(`/decks/${deckId}/update-color`);
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
      const response = await httpClient.get<User[]>('/users');
      
      // Verificar que tenemos datos válidos
      if (response === null || response === undefined) {
        console.error('Respuesta nula o indefinida al obtener usuarios');
        return [];
      }
      
      if (!Array.isArray(response)) {
        console.error('Respuesta inesperada al obtener usuarios (no es un array):', response);
        // Intentar convertir a array si es posible
        if (response && typeof response === 'object') {
          console.log('Intentando convertir objeto a array:', response);
          // Si es un objeto con múltiples propiedades que podrían ser usuarios
          const values = Object.values(response);
          if (values.length > 0) {
            console.log('Convertido a array con éxito, elementos:', values.length);
            return values as User[];
          }
        }
        return [];
      }
      
      console.log('Users retrieved successfully:', response);
      return response;
    } catch (error) {
      console.error('Error retrieving users:', error);
      return [];
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
      const response = await httpClient.post<User>('/users', createDto);
      console.log('User created successfully:', response);
      return response;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
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
      const response = await httpClient.put<User>(`/users/${userId}`, userDto);
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
      await httpClient.delete(`/users/${userId}`);
      console.log(`User ${userId} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  },

  // Sets
  createSet: async (setData: Partial<SetMtg>): Promise<SetMtg> => {
    try {
      return httpClient.post<SetMtg>('/sets', setData);
    } catch (error) {
      console.error('Error creando set:', error);
      throw error;
    }
  },

  updateSet: async (setId: number, setData: Partial<SetMtg>): Promise<SetMtg> => {
    try {
      return httpClient.put<SetMtg>(`/sets/${setId}`, setData);
    } catch (error) {
      console.error(`Error actualizando set ${setId}:`, error);
      throw error;
    }
  },

  deleteSet: async (setId: number): Promise<void> => {
    try {
      await httpClient.delete(`/sets/${setId}`);
    } catch (error) {
      console.error(`Error eliminando set ${setId}:`, error);
      throw error;
    }
  },

  // Cartas
  getAllCards: async (page: number = 0, size: number = 50): Promise<Card[]> => {
    try {
      // Obtener las cartas
      const cards = await httpClient.get<Card[]>('/cards', {
        params: { page, size }
      });
      
      // Si hay cartas, obtener todos los sets para enriquecer los datos
      if (cards && cards.length > 0) {
        try {
          // Obtener todos los sets
          const sets = await httpClient.get<SetMtg[]>('/sets');
          
          // Crear un mapa de sets por ID para búsqueda rápida
          const setsMap = new Map<number, SetMtg>();
          sets.forEach(set => {
            // Asegurarse de que el set tiene id/setId
            const setId = set.id || set.setId;
            if (setId) {
              setsMap.set(setId, set);
              // Asegurar aliases de compatibilidad
              set.id = setId;
              set.code = set.code || set.setCode;
            }
          });
          
          // Enriquecer cada carta con los datos de su set
          return cards.map(card => {
            const cardSet = setsMap.get(card.setId);
            return {
              ...card,
              setName: cardSet?.name || 'Unknown Set',
              setCode: cardSet?.setCode || cardSet?.code || 'UNK'
            };
          });
        } catch (error) {
          console.error('Error obteniendo sets para enriquecer cartas:', error);
          // Si falla la obtención de sets, devolver las cartas sin enriquecer
          return cards;
        }
      }
      
      return cards;
    } catch (error) {
      console.error('Error obteniendo todas las cartas:', error);
      return [];
    }
  },

  createCard: async (cardData: Partial<Card>): Promise<Card> => {
    try {
      return httpClient.post<Card>('/cards', cardData);
    } catch (error) {
      console.error('Error creando carta:', error);
      throw error;
    }
  },

  updateCard: async (cardId: number, cardData: Partial<Card>): Promise<Card> => {
    try {
      console.log(`Actualizando carta con ID ${cardId}, datos:`, JSON.stringify(cardData, null, 2));
      const response = await httpClient.put<Card>(`/cards/${cardId}`, cardData);
      console.log(`Carta ${cardId} actualizada con éxito. Respuesta:`, response);
      return response;
    } catch (error) {
      console.error(`Error actualizando carta ${cardId}:`, error);
      throw error;
    }
  },

  deleteCard: async (cardId: number): Promise<void> => {
    try {
      await httpClient.delete(`/cards/${cardId}`);
    } catch (error) {
      console.error(`Error eliminando carta ${cardId}:`, error);
      throw error;
    }
  },

  // Mazos (funciones administrativas)
  getAllDecks: async (page: number = 0, size: number = 50): Promise<Deck[]> => {
    try {
      return httpClient.get<Deck[]>('/decks', {
        params: { page, size }
      });
    } catch (error) {
      console.error('Error obteniendo todos los mazos:', error);
      return [];
    }
  },

  deleteDeck: async (deckId: number): Promise<void> => {
    try {
      await httpClient.delete(`/decks/${deckId}`);
    } catch (error) {
      console.error(`Error eliminando mazo ${deckId}:`, error);
      throw error;
    }
  }
};

export { apiService };
export default apiService;
