// Interfaces comunes utilizadas en los servicios

// Cartas y colecciones
export interface SetMtg {
  setId: number;
  id?: number; // Alias para setId para compatibilidad
  name: string;
  setCode: string;
  code?: string; // Alias para setCode para compatibilidad
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

export interface UserCollectionCard {
  cardId: number;
  collectionId: number;
  nCopies?: number;
  ncopies?: number; // Variante que viene del backend
  card?: Card;
  // Campos planos que vienen directamente del backend
  cardName?: string;
  cardImageUrl?: string;
  cardType?: string;
  manaCost?: string;
  rarity?: string;
  setId?: number;
  setCode?: string;
}

export interface UserCollection {
  collectionId: number;
  userId: number;
  name: string;
}

// Mazos
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

// Autenticación - Sistema JWT Simple
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  roles: string[];
}

export interface User {
  userId: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  joinDate?: string;
  roles: string[];
  enabled: boolean;
} 