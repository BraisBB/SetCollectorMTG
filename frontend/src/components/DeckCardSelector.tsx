import React, { useState, useEffect } from 'react';
import { Card, CardDeck } from '../services/types';
import SearchBar, { SearchParams } from './SearchBar';
import './DeckCardSelector.css';
import { apiService } from '../services';
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

  // Check if a card can have multiple copies based on deck format
  const canIncreaseCardCopies = (currentCopies: number): boolean => {
    // In Commander format, only one copy of each card is allowed
    if (deckGameType === 'COMMANDER') {
      return currentCopies < 1;
    }
    // In Standard format, up to 4 copies are allowed (except basic lands which we don't check here)
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
      await apiService.addCardToDeck(deckId, card.cardId, 1);
      
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
    if (newQuantity > currentQuantity && !canIncreaseCardCopies(currentQuantity)) {
      const formatName = deckGameType === 'COMMANDER' ? 'Commander' : 'Standard';
      const maxCopies = deckGameType === 'COMMANDER' ? 1 : 4;
      
      setError(`Cannot add more copies. ${formatName} format only allows ${maxCopies} ${maxCopies === 1 ? 'copy' : 'copies'} of each card.`);
      return;
    }
    
    // Guardar valor antiguo para poder revertirlo si falla
    const oldQuantity = localQuantities[cardId] || 1;
    
    // Actualizar UI inmediatamente (optimista)
    setLocalQuantities(prev => ({ ...prev, [cardId]: newQuantity }));
    
    try {
      // Realizar llamada al backend
      await apiService.updateCardQuantity(deckId, cardId, newQuantity);
      await apiService.updateDeckColor(deckId);
      
      // Refrescar datos completos del mazo
      onCardsUpdated();
      
      // Clear any previous error
      setError(null);
    } catch (err: any) {
      console.error('Error actualizando cantidad de carta:', err);
      
      // More specific error message based on response
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.message && err.message.includes('Commander')) {
        setError('Commander format only allows 1 copy of each card.');
      } else if (err.message && err.message.includes('Standard')) {
        setError('Standard format only allows 4 copies of each card.');
      } else {
        setError('Failed to update card quantity.');
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
    return symbols.map((symbol, idx) => {
      const clean = symbol.replace(/[{}]/g, '');
      return <i key={idx} className={`ms ms-${clean.toLowerCase()}`}></i>;
    });
  };
  
  // Componente para renderizar las cuantidades de cartas en la lista
  const renderCardQuantity = (cardId: number, nCopies: number) => {
    return (
      <span className="quantity">
        {nCopies}
      </span>
    );
  };
  
  return (
    <div className="deck-card-selector deck-card-selector-flex">
      {/* Imagen de la carta seleccionada o primera */}
      <div className="deck-card-image-panel">
        {cardToShow && cardToShow.cardImageUrl && (
          <img
            src={cardToShow.cardImageUrl}
            alt={cardToShow.cardName}
            className="side-card-image"
          />
        )}
      </div>
      <div className="deck-card-list-panel">
        <div className="deck-selector-header">
          <h2>Deck Cards</h2>
          <div className="deck-selector-actions" style={{ display: 'flex', alignItems: 'center' }}>
            {isEditMode && (
              <button 
                className="delete-deck-button" 
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  backgroundColor: '#d32f2f',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 0.8rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  marginRight: '10px',
                  fontSize: '0.9rem'
                }}
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
                // Notify parent component about edit mode change
                if (onEditModeChange) {
                  onEditModeChange(newEditMode);
                }
              }}
            >
              {isEditMode ? 'Done Editing' : 'Edit Deck'}
            </button>
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {/* Modal de confirmación para borrar el mazo */}
        {showDeleteConfirm && (
          <div 
            className="delete-confirm-modal" 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}
          >
            <div 
              className="delete-confirm-content" 
              style={{
                backgroundColor: '#2c2c2c',
                padding: '20px',
                borderRadius: '8px',
                maxWidth: '400px',
                textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>Delete Deck</h3>
              <p style={{ margin: '0 0 20px 0', color: '#ddd', lineHeight: '1.5' }}>
                Are you sure you want to delete this deck? This will permanently remove the deck and all its cards. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: '#ddd',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteDeck}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#d32f2f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
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
            <div className="search-container">
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
                          <span className="card-cost">{card.manaCost}</span>
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
                                disabled={!canIncreaseCardCopies(localQuantities[card.cardId] || card.nCopies)}
                                title={deckGameType === 'COMMANDER' ? 'Commander format only allows 1 copy of each card' : ''}
                              >
                                +
                              </button>
                            </div>
                            <span className="card-name">
                              {card.cardName} {renderManaSymbols(card.manaCost)}
                            </span>
                            <button 
                              className="remove-card-btn" 
                              onClick={() => handleRemoveCard(card.cardId)}
                            >
                              ×
                            </button>
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
                {sortedTypes.map(type => (
                  <div key={type} className="card-type-section">
                    <h4 className="type-header">{type} ({groupedCards[type].length})</h4>
                    <ul className="cards-by-type">
                      {groupedCards[type]
                        .sort((a, b) => a.cardName.localeCompare(b.cardName))
                        .map(card => (
                          <li
                            key={card.cardId}
                            className="deck-card-item view-mode"
                            onMouseEnter={() => setHoveredCardId(card.cardId)}
                            onMouseLeave={() => setHoveredCardId(null)}
                          >
                            <span className="quantity">{card.nCopies}</span>
                            <span className="card-name">
                              {card.cardName} {renderManaSymbols(card.manaCost)}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckCardSelector;