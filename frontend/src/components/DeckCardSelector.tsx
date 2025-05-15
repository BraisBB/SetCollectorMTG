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
}

const DeckCardSelector: React.FC<DeckCardSelectorProps> = ({ deckId, cards, onCardsUpdated }) => {
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
  
  // Activar el modo de edición si el mazo está vacío
  useEffect(() => {
    if (cards.length === 0) {
      setIsEditMode(true);
    }
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
  const handleCardSelect = (card: Card) => {
    setSelectedCard(card);
    setQuantity(1);
  };
  
  // Cambiar cantidad
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };
  
  // Añadir carta al mazo
  const handleAddCard = async () => {
    if (!selectedCard) return;
    
    try {
      await apiService.addCardToDeck(deckId, selectedCard.cardId, quantity);
      setSuccess(`Added ${quantity}x ${selectedCard.name} to deck`);
      setSelectedCard(null);
      setQuantity(1);
      onCardsUpdated(); // Actualizar la lista de cartas
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error adding card to deck:', err);
      setError(`Failed to add card: ${err.message || 'Unknown error'}`);
    }
  };
  
  // Eliminar carta del mazo
  const handleRemoveCard = async (cardId: number) => {
    try {
      await apiService.removeCardFromDeck(deckId, cardId);
      onCardsUpdated(); // Actualizar la lista de cartas
    } catch (err: any) {
      console.error('Error removing card from deck:', err);
      setError(`Failed to remove card: ${err.message || 'Unknown error'}`);
    }
  };
  
  // Actualizar cantidad de una carta
  const handleUpdateCardQuantity = async (cardId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveCard(cardId);
      return;
    }
    
    try {
      await apiService.updateCardQuantity(deckId, cardId, newQuantity);
      onCardsUpdated(); // Actualizar la lista de cartas
    } catch (err: any) {
      console.error('Error updating card quantity:', err);
      setError(`Failed to update quantity: ${err.message || 'Unknown error'}`);
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
  
  return (
    <div className="deck-card-selector">
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
            onClick={() => setIsEditMode(!isEditMode)}
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
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteDeck}
                disabled={isDeleting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#d32f2f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  opacity: isDeleting ? 0.7 : 1
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
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
                      className={`search-result-item ${selectedCard?.cardId === card.cardId ? 'selected' : ''}`}
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
            
            {selectedCard && (
              <div className="selected-card-controls">
                <div className="selected-card-name">{selectedCard.name}</div>
                <div className="quantity-control">
                  <label htmlFor="card-quantity">Quantity:</label>
                  <input 
                    type="number" 
                    id="card-quantity" 
                    min="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                  />
                  <button 
                    className="add-card-button"
                    onClick={handleAddCard}
                  >
                    Add to Deck
                  </button>
                </div>
              </div>
            )}
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
                        <li key={card.cardId} className="deck-card-item">
                          <div className="card-quantity-controls">
                            <button 
                              className="quantity-btn decrease" 
                              onClick={() => handleUpdateCardQuantity(card.cardId, card.nCopies - 1)}
                            >
                              -
                            </button>
                            <span className="quantity">{card.nCopies}x</span>
                            <button 
                              className="quantity-btn increase" 
                              onClick={() => handleUpdateCardQuantity(card.cardId, card.nCopies + 1)}
                            >
                              +
                            </button>
                          </div>
                          <span className="card-name">{card.cardName}</span>
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
                        <li key={card.cardId} className="deck-card-item view-mode">
                          <span className="quantity">{card.nCopies}x</span>
                          <span className="card-name">{card.cardName}</span>
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
  );
};

export default DeckCardSelector; 