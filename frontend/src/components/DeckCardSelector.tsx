import React, { useState, useEffect } from 'react';
import { Card, CardDeck } from '../services/types';
import SearchBar, { SearchParams } from './SearchBar';
import './DeckCardSelector.css';
import { apiService } from '../services';

interface DeckCardSelectorProps {
  deckId: number;
  cards: CardDeck[];
  onCardsUpdated: () => void;
}

const DeckCardSelector: React.FC<DeckCardSelectorProps> = ({ deckId, cards, onCardsUpdated }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
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
  
  return (
    <div className="deck-card-selector">
      <div className="deck-selector-header">
        <h2>Deck Cards</h2>
        <button 
          className={`toggle-edit-button ${isEditMode ? 'active' : ''}`}
          onClick={() => setIsEditMode(!isEditMode)}
        >
          {isEditMode ? 'Done Editing' : 'Edit Deck'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
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