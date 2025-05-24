import React, { useState, useEffect } from 'react';
import { Card, CardDeck } from '../services/types';
import SearchBar, { SearchParams } from './SearchBar';
import './styles/DeckCardSelector.css';
import { apiService } from '../services';
import { collectionService } from '../services';
import { useNavigate } from 'react-router-dom';

interface DeckCardSelectorProps {
  deckId: number;
  cards: CardDeck[];
  onCardsUpdated: () => void;
  deckGameType?: string; // Add deckGameType prop
  onEditModeChange?: (isEditMode: boolean) => void; // Add callback for edit mode changes
}

const DeckCardSelector: React.FC<DeckCardSelectorProps> = ({ 
  deckId, 
  cards, 
  onCardsUpdated,
  deckGameType = 'STANDARD', // Default to STANDARD if not provided 
  onEditModeChange
}) => {
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  const [localQuantities, setLocalQuantities] = useState<Record<number, number>>({});
  const [userCollectionCards, setUserCollectionCards] = useState<Record<number, boolean>>({});
  const [checkingCollection, setCheckingCollection] = useState(false);
  
  // Efecto para limpiar mensajes de error automáticamente después de 10 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 10000); // 10 segundos
      
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // Efecto para limpiar mensajes de éxito automáticamente después de 3 segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000); // 3 segundos
      
      return () => clearTimeout(timer);
    }
  }, [success]);
  
  // Obtener el tipo base de la carta (Creature, Instant, etc.)
  const getBaseCardType = (cardType: string): string => {
    if (!cardType) return 'Other';
    if (cardType.includes('Creature')) return 'Creature';
    if (cardType.includes('Planeswalker')) return 'Planeswalker';
    if (cardType.includes('Instant')) return 'Instant';
    if (cardType.includes('Sorcery')) return 'Sorcery';
    if (cardType.includes('Artifact')) return 'Artifact';
    if (cardType.includes('Enchantment')) return 'Enchantment';
    if (cardType.includes('Land')) return 'Land';
    return 'Other';
  };
  
  // Agrupar cartas por tipo
  const groupedCards = cards.reduce((groups: Record<string, CardDeck[]>, card) => {
    const type = getBaseCardType(card.cardType);
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(card);
    return groups;
  }, {});
  
  // Orden de los tipos de cartas
  const typeOrder = ['Creature', 'Planeswalker', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Land'];
  
  // Ordenar tipos de cartas según el orden predefinido
  const sortedTypes = Object.keys(groupedCards).sort((a, b) => {
    const indexA = typeOrder.indexOf(a);
    const indexB = typeOrder.indexOf(b);
    return (indexA !== -1 ? indexA : 999) - (indexB !== -1 ? indexB : 999);
  });

  // Check if a card can have multiple copies based on deck format and card type
  const canIncreaseCardCopies = (currentCopies: number, cardId: number): boolean => {
    // Get the card from the cards array
    const card = cards.find(c => c.cardId === cardId);
    if (!card) return false;
    
    // Helper function to check if a card is a basic land
    const isBasicLand = (cardType: string): boolean => {
      if (!cardType) return false;
      const lowerType = cardType.toLowerCase();
      // Basic lands are specifically marked as "Basic Land" in MTG
      return lowerType.includes('basic') && lowerType.includes('land');
    };
    
    const cardIsBasicLand = isBasicLand(card.cardType);
    
    // In Commander format
    if (deckGameType === 'COMMANDER') {
      // Basic lands can have multiple copies even in Commander
      if (cardIsBasicLand) {
        return true; // No limit for basic lands
      }
      // Non-basic cards: only 1 copy allowed
      return currentCopies < 1;
    }
    
    // In Standard format
    if (deckGameType === 'STANDARD') {
      // Basic lands: no limit
      if (cardIsBasicLand) {
        return true; // No limit for basic lands
      }
      // Non-basic cards: up to 4 copies
      return currentCopies < 4;
    }
    
    // Default case (shouldn't happen)
    return currentCopies < 4;
  };
  
  // Obtener la carta a mostrar en la imagen
  let cardToShow = null;
  if (hoveredCardId) {
    cardToShow = cards.find(c => c.cardId === hoveredCardId);
  } else {
    // Buscar la primera carta del primer grupo
    const firstType = sortedTypes[0];
    if (firstType && groupedCards[firstType] && groupedCards[firstType].length > 0) {
      cardToShow = groupedCards[firstType][0];
    }
  }
  
  // Activar el modo de edición si el mazo está vacío
  useEffect(() => {
    if (cards.length === 0) {
      setIsEditMode(true);
    }
  }, [cards]);
  
  // Sincronizar cantidades locales con las del backend cuando cambian las cartas
  useEffect(() => {
    console.log("Actualizando cantidades locales desde props cards:", cards);
    const initial: Record<number, number> = {};
    cards.forEach(card => {
      console.log(`Card ID: ${card.cardId}, Name: ${card.cardName}, nCopies: ${card.nCopies}`);
      initial[card.cardId] = card.nCopies;
    });
    setLocalQuantities(initial);
  }, [cards]);

  // Cargar las cartas de la colección del usuario para verificar cuáles posee
  useEffect(() => {
    const checkUserCollection = async () => {
      if (cards.length > 0) {
        setCheckingCollection(true);
        try {
          // Obtener las cartas de la colección del usuario
          const collectionCards = await collectionService.getUserCollectionCards();
          
          // Crear un mapa para verificación rápida
          const collectionMap: Record<number, boolean> = {};
          
          // Llenar el mapa con las cartas de la colección
          collectionCards.forEach(collectionCard => {
            if (collectionCard.cardId) {
              // Verificar tanto nCopies como ncopies (variante del backend)
              const copies = collectionCard.nCopies !== undefined ? collectionCard.nCopies : 
                             collectionCard.ncopies !== undefined ? collectionCard.ncopies : 0;
              
              collectionMap[collectionCard.cardId] = copies > 0;
              
              // Log detallado para depuración
              console.log(`Carta en colección - ID: ${collectionCard.cardId}, Nombre: ${collectionCard.cardName || '?'}, Copias: ${copies}`);
            }
          });
          
          // Imprimir información de depuración para cada carta del mazo
          console.log("===== Comparando cartas del mazo con la colección =====");
          cards.forEach(card => {
            console.log(`Carta ID: ${card.cardId}, Nombre: ${card.cardName}, ¿En colección?: ${collectionMap[card.cardId] === true ? 'SÍ' : 'NO'}`);
          });
          console.log("========================================================");
          
          console.log("Cartas en colección del usuario:", collectionMap);
          setUserCollectionCards(collectionMap);
        } catch (error) {
          console.error("Error al cargar cartas de la colección:", error);
        } finally {
          setCheckingCollection(false);
        }
      }
    };
    
    checkUserCollection();
  }, [cards]);
  
  // Manejar la búsqueda de cartas
  const handleSearch = async (searchParams: SearchParams) => {
    setLoading(true);
    setHasSearched(true);
    setError(null);
    
    try {
      // Utilizar el servicio API para obtener cartas
      const results = await apiService.searchCards(searchParams);
      setSearchResults(results);
      
      if (results.length === 0) {
        setError("No cards found matching your search criteria.");
      }
    } catch (err: any) {
      console.error('Error searching cards:', err);
      setError("Failed to search cards. Please try again.");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Seleccionar una carta de los resultados de búsqueda
  const handleCardSelect = async (card: Card) => {
    try {
      // Añadir la carta directamente al mazo con cantidad 1
      await apiService.addCardToDeck(deckId, card.cardId);
      
      // Actualizar color del mazo basado en las cartas agregadas
      await apiService.updateDeckColor(deckId);
      
      setSuccess(`Added ${card.name} to deck`);
      onCardsUpdated(); // Actualizar la lista de cartas
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error adding card to deck:', err);
      
      // More specific error message based on response
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError(`Failed to add card: ${err.message || 'Unknown error'}`);
      }
    }
  };
  
  // Manejar cambio de cantidad optimista con espera a la respuesta
  const handleOptimisticQuantityChange = async (cardId: number, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    // Check format restrictions before making the API call
    const currentQuantity = localQuantities[cardId] || 1;
    
    // If trying to increase over format limit, show error and don't make API call
    if (newQuantity > currentQuantity && !canIncreaseCardCopies(currentQuantity, cardId)) {
      const card = cards.find(c => c.cardId === cardId);
      const cardType = card?.cardType?.toLowerCase() || '';
      const isBasicLand = cardType.includes('basic') && cardType.includes('land');
      
      let errorMessage = '';
      if (deckGameType === 'COMMANDER') {
        if (isBasicLand) {
          errorMessage = 'This should not happen - basic lands have no copy limit in Commander';
        } else {
          errorMessage = 'Commander format only allows 1 copy of each non-basic card.';
        }
      } else {
        if (isBasicLand) {
          errorMessage = 'This should not happen - basic lands have no copy limit in Standard';
        } else {
          errorMessage = 'Standard format only allows 4 copies of each non-basic card.';
        }
      }
      
      setError(errorMessage);
      return;
    }
    
    // Guardar valor antiguo para poder revertirlo si falla
    const oldQuantity = localQuantities[cardId] || 1;
    
    // Actualizar UI inmediatamente (optimista)
    setLocalQuantities(prev => ({ ...prev, [cardId]: newQuantity }));
    
    try {
      // Realizar llamada al backend
      console.log(`Updating card quantity: deckId=${deckId}, cardId=${cardId}, newQuantity=${newQuantity}, deck format=${deckGameType}`);
      await apiService.updateCardQuantity(deckId, cardId, newQuantity);
      await apiService.updateDeckColor(deckId);
      
      // Refrescar datos completos del mazo
      onCardsUpdated();
      
      // Clear any previous error
      setError(null);
    } catch (err: any) {
      console.error('Error actualizando cantidad de carta:', err);
      
      // Mostrar información detallada del error para depuración
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
      }
      
      // More specific error message based on response
      if (err.response && err.response.data && err.response.data.message) {
        setError(`Error: ${err.response.data.message}`);
      } else if (err.message && err.message.includes('Commander')) {
        setError('Commander format only allows 1 copy of each card.');
      } else if (err.message && err.message.includes('Standard')) {
        setError('Standard format only allows 4 copies of each card.');
      } else {
        setError(`Failed to update card quantity: ${err.message || 'Unknown error'}`);
      }
      
      // Revertir cambio en UI si falla la llamada al backend
      setLocalQuantities(prev => ({ ...prev, [cardId]: oldQuantity }));
    }
  };
  
  // Eliminar carta del mazo
  const handleRemoveCard = async (cardId: number) => {
    try {
      await apiService.removeCardFromDeck(deckId, cardId);
      // Actualizar color del mazo
      await apiService.updateDeckColor(deckId);
      onCardsUpdated(); // Actualizar la lista de cartas
    } catch (err: any) {
      console.error('Error removing card from deck:', err);
      setError(`Failed to remove card: ${err.message || 'Unknown error'}`);
    }
  };
  
  // Eliminar mazo y redireccionar a la colección
  const handleDeleteDeck = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      console.log(`Eliminando mazo con ID: ${deckId}`);
      
      // El backend ahora elimina automáticamente todas las cartas asociadas
      await apiService.deleteDeck(deckId);
      
      console.log('Mazo eliminado con éxito, redireccionando a My Decks');
      navigate('/collection', { state: { activeTab: 'decks' } });
    } catch (err: any) {
      console.error('Error deleting deck:', err);
      let errorMessage = 'Failed to delete deck. Please try again.';
      
      // Extraer mensaje de error más específico si está disponible
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    }
  };
  
  // Función para renderizar los iconos de maná a partir del manaCost
  const renderManaSymbols = (manaCost: string) => {
    if (!manaCost) return null;
    // Extraer símbolos {W}, {U}, {B}, {R}, {G}, {C}, {X}, {1}, etc.
    const regex = /\{([^}]+)\}/g;
    const symbols = manaCost.match(regex);
    if (!symbols) return null;
    return (
      <span className="mana-symbols">
        {symbols.map((symbol, idx) => {
          const clean = symbol.replace(/[{}]/g, '');
          return <i key={idx} className={`ms ms-${clean.toLowerCase()}`}></i>;
        })}
      </span>
    );
  };
  
  // Verificar si una carta está en la colección del usuario
  const isCardInCollection = (cardId: number): boolean => {
    // Si la información de la colección no está cargada, considerar todas las cartas como en la colección
    if (Object.keys(userCollectionCards).length === 0) {
      return true;
    }
    
    // Verificar directamente si la carta está en la colección del usuario
    return userCollectionCards[cardId] === true;
  };
  
  return (
    <div className="deck-card-selector deck-card-selector-flex">
      {/* Imagen de la carta seleccionada o primera */}
      <div className="deck-card-image-panel">
        {cardToShow && cardToShow.cardImageUrl && (
          <>
            <img
              src={cardToShow.cardImageUrl}
              alt={cardToShow.cardName}
              className="side-card-image"
            />
            {!isCardInCollection(cardToShow.cardId) && (
              <div className="not-in-collection-label">
                Not in collection
              </div>
            )}
          </>
        )}
      </div>
      <div className="deck-card-list-panel">
        <div className="deck-selector-header">
          <h2>Deck Cards</h2>
          <div className="deck-selector-actions deck-selector-actions-style">
            {isEditMode && (
              <button 
                className="delete-deck-button delete-deck-button-style" 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
              >
                Delete
              </button>
            )}
            <button 
              className={`toggle-edit-button ${isEditMode ? 'active' : ''}`}
              onClick={() => {
                const newEditMode = !isEditMode;
                setIsEditMode(newEditMode);
                // Limpiar mensajes de error al cambiar el modo
                setError(null);
                // Notify parent component about edit mode change
                if (onEditModeChange) {
                  onEditModeChange(newEditMode);
                }
              }}
            >
              {isEditMode ? 'Save' : 'Edit Deck'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="error-message" onClick={() => setError(null)}>
            {error}
          </div>
        )}
        {success && (
          <div className="success-message" onClick={() => setSuccess(null)}>
            {success}
          </div>
        )}
        
        {/* Modal de confirmación para borrar el mazo */}
        {showDeleteConfirm && (
          <div 
            className="delete-confirm-modal modal-overlay-style" 
          >
            <div 
              className="delete-confirm-content modal-content-style" 
            >
              <h3 className="delete-warning-title">Delete Deck</h3>
              <p className="delete-warning-text">
                Are you sure you want to delete this deck? This will permanently remove the deck and all its cards. This action cannot be undone.
              </p>
              <div className="delete-warning-actions">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="cancel-delete-button"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteDeck}
                  className="confirm-delete-button"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Deck'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {isEditMode ? (
          <div className="deck-edit-mode">
            <div className="search-section">
              <SearchBar onSearch={handleSearch} />
            </div>
            
            <div className="card-selection-area">
              <div className="search-results-container">
                {loading ? (
                  <div className="loading-spinner">Searching cards...</div>
                ) : hasSearched && searchResults.length === 0 ? (
                  <div className="no-results">No cards found matching your search criteria.</div>
                ) : hasSearched ? (
                  <div className="search-results-list">
                    {searchResults.map(card => (
                      <div 
                        key={card.cardId} 
                        className="search-result-item"
                        onClick={() => handleCardSelect(card)}
                      >
                        <div className="card-name">{card.name}</div>
                        <div className="card-meta">
                          <span className="card-type">{card.cardType}</span>
                          <span className="card-cost">{renderManaSymbols(card.manaCost)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="search-hint">
                    Search for cards to add to your deck
                  </div>
                )}
              </div>
            </div>
            
            <div className="current-deck-list">
              <h3>Current Deck ({cards.length} cards)</h3>
              
              {sortedTypes.length > 0 ? (
                sortedTypes.map(type => (
                  <div key={type} className="card-type-section">
                    <h4 className="type-header">{type} ({groupedCards[type].length})</h4>
                    <ul className="cards-by-type">
                      {groupedCards[type]
                        .sort((a, b) => a.cardName.localeCompare(b.cardName))
                        .map(card => (
                          <li
                            key={card.cardId}
                            className="deck-card-item"
                            onMouseEnter={() => setHoveredCardId(card.cardId)}
                            onMouseLeave={() => setHoveredCardId(null)}
                          >
                            <div className="card-quantity-controls">
                              <button 
                                className="quantity-btn decrease" 
                                onClick={() => handleOptimisticQuantityChange(card.cardId, (localQuantities[card.cardId] || card.nCopies) - 1)}
                                disabled={(localQuantities[card.cardId] || card.nCopies) <= 1}
                              >
                                -
                              </button>
                              <span className="quantity">{localQuantities[card.cardId] || card.nCopies}</span>
                              <button 
                                className="quantity-btn increase" 
                                onClick={() => handleOptimisticQuantityChange(card.cardId, (localQuantities[card.cardId] || card.nCopies) + 1)}
                                disabled={!canIncreaseCardCopies(localQuantities[card.cardId] || card.nCopies, card.cardId)}
                                title={(() => {
                                  const cardType = card.cardType?.toLowerCase() || '';
                                  const isBasicLand = cardType.includes('basic') && cardType.includes('land');
                                  
                                  if (deckGameType === 'COMMANDER') {
                                    if (isBasicLand) {
                                      return 'Basic lands have no copy limit in Commander';
                                    } else {
                                      return 'Commander format only allows 1 copy of each non-basic card';
                                    }
                                  } else {
                                    if (isBasicLand) {
                                      return 'Basic lands have no copy limit in Standard';
                                    } else {
                                      return 'Standard format allows up to 4 copies of each non-basic card';
                                    }
                                  }
                                })()}
                              >
                                +
                              </button>
                            </div>
                            <span className="card-name">
                              {card.cardName}
                            </span>
                            <div className="action-icons">
                              <div className="mana-symbols">
                                {renderManaSymbols(card.manaCost)}
                              </div>
                              <button 
                                className="remove-card-btn" 
                                onClick={() => handleRemoveCard(card.cardId)}
                              >
                                ×
                              </button>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))
              ) : (
                <div className="empty-deck-message">
                  <p>Your deck is empty. Use the search above to find and add cards.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="deck-view-mode">
            {cards.length === 0 ? (
              <div className="empty-deck-message">
                <p>This deck is empty. Click "Edit Deck" to start adding cards.</p>
              </div>
            ) : (
              <div className="deck-card-groups">
                {checkingCollection ? (
                  <div className="loading-spinner">Checking your collection...</div>
                ) : (
                  sortedTypes.map(type => (
                    <div key={type} className="card-type-section">
                      <h4 className="type-header">{type} ({groupedCards[type].length})</h4>
                      <ul className="cards-by-type">
                        {groupedCards[type]
                          .sort((a, b) => a.cardName.localeCompare(b.cardName))
                          .map(card => (
                            <li
                              key={card.cardId}
                              className={`deck-card-item view-mode ${!isCardInCollection(card.cardId) ? 'not-in-collection' : ''}`}
                              onMouseEnter={() => setHoveredCardId(card.cardId)}
                              onMouseLeave={() => setHoveredCardId(null)}
                              title={!isCardInCollection(card.cardId) ? "You don't have this card in your collection" : ""}
                            >
                              <span className="quantity">{card.nCopies}</span>
                              <span className="card-name">
                                {card.cardName}
                              </span>
                              <div className="action-icons">
                                <div className="mana-symbols">
                                  {renderManaSymbols(card.manaCost)}
                                </div>
                                <button 
                                  className="remove-card-btn" 
                                  onClick={() => handleRemoveCard(card.cardId)}
                                >
                                  ×
                                </button>
                              </div>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckCardSelector;