import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SearchBar, { SearchParams } from '../components/SearchBar';
import api, { Deck, CardDeck, Card } from '../services/apiService';
import './DeckEditor.css';

const DeckEditor: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [deckCards, setDeckCards] = useState<CardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Cargar datos del deck
  useEffect(() => {
    const fetchDeckData = async () => {
      if (!deckId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const deckData = await api.getDeckById(parseInt(deckId));
        setDeck(deckData);
        
        const cardsData = await api.getCardsInDeck(parseInt(deckId));
        setDeckCards(cardsData);
      } catch (err: any) {
        console.error('Error fetching deck data:', err);
        setError('Failed to load deck data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDeckData();
  }, [deckId]);

  // Manejar la búsqueda de cartas
  const handleSearch = async (searchParams: SearchParams) => {
    setSearchLoading(true);
    setHasSearched(true);
    
    try {
      // Aquí utilizamos la API existente para buscar cartas
      const response = await fetch(`/api/cards?${new URLSearchParams({
        name: searchParams.name || '',
        color: searchParams.color || '',
        type: searchParams.type || '',
        rarity: searchParams.rarity || '',
        setCode: searchParams.set || ''
      }).toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }
      
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Error searching cards:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Abrir modal para añadir cartas
  const openEditModal = () => {
    setIsEditModalOpen(true);
    setSearchResults([]);
    setHasSearched(false);
    setSelectedCard(null);
    setQuantity(1);
  };

  // Cerrar modal
  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  // Seleccionar una carta de los resultados de búsqueda
  const handleCardSelect = (card: Card) => {
    setSelectedCard(card);
    setQuantity(1); // Resetear cantidad al seleccionar nueva carta
  };

  // Cambiar cantidad
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  // Añadir carta al deck
  const handleAddCard = async () => {
    if (!selectedCard || !deck) return;
    
    try {
      const cardId = selectedCard.cardId;
      await api.addCardToDeck(parseInt(deckId!), cardId, quantity);
      
      // Actualizar la lista de cartas
      const updatedCards = await api.getCardsInDeck(parseInt(deckId!));
      setDeckCards(updatedCards);
      
      // Actualizar datos del deck
      const updatedDeck = await api.getDeckById(parseInt(deckId!));
      setDeck(updatedDeck);
      
      closeEditModal();
    } catch (err: any) {
      console.error('Error adding card to deck:', err);
      setError(err.response?.data?.message || 'Failed to add card to deck');
    }
  };

  // Eliminar carta del deck
  const handleRemoveCard = async (cardId: number) => {
    if (!confirm('Are you sure you want to remove this card from the deck?')) return;
    
    try {
      await api.removeCardFromDeck(parseInt(deckId!), cardId);
      
      // Actualizar la lista de cartas
      const updatedCards = await api.getCardsInDeck(parseInt(deckId!));
      setDeckCards(updatedCards);
      
      // Actualizar datos del deck
      const updatedDeck = await api.getDeckById(parseInt(deckId!));
      setDeck(updatedDeck);
    } catch (err: any) {
      console.error('Error removing card from deck:', err);
      setError('Failed to remove card from deck');
    }
  };

  // Actualizar cantidad de una carta
  const handleUpdateCardQuantity = async (cardId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveCard(cardId);
      return;
    }
    
    try {
      await api.updateCardQuantity(parseInt(deckId!), cardId, newQuantity);
      
      // Actualizar la lista de cartas
      const updatedCards = await api.getCardsInDeck(parseInt(deckId!));
      setDeckCards(updatedCards);
      
      // Actualizar datos del deck
      const updatedDeck = await api.getDeckById(parseInt(deckId!));
      setDeck(updatedDeck);
    } catch (err: any) {
      console.error('Error updating card quantity:', err);
      setError('Failed to update card quantity');
    }
  };

  // Guardar cambios en el deck
  const handleSaveDeck = async () => {
    setSaveSuccess(true);
    
    // Mostrar mensaje de éxito por 3 segundos
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  // Volver a la página de colección
  const handleBackToCollection = () => {
    navigate('/collection');
  };

  if (loading) {
    return (
      <div className="deck-editor-page">
        <Header />
        <div className="container">
          <div className="loading-spinner">Loading deck data...</div>
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="deck-editor-page">
        <Header />
        <div className="container">
          <div className="error-message">{error || 'Deck not found'}</div>
          <button className="back-button" onClick={handleBackToCollection}>
            Back to Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="deck-editor-page">
      <Header />
      <div className="container">
        <div className="deck-editor-header">
          <div className="deck-info">
            <h1>{deck.deckName}</h1>
            <div className="deck-meta">
              <span className="deck-type">{deck.gameType}</span>
              <span className="deck-color">{deck.deckColor}</span>
              <span className="card-count">{deck.totalCards} cards</span>
            </div>
          </div>
          <div className="deck-actions">
            <button 
              className="edit-button" 
              onClick={openEditModal}
            >
              Add Cards
            </button>
            <button 
              className="save-button" 
              onClick={handleSaveDeck}
            >
              Save Deck
            </button>
          </div>
        </div>
        
        {saveSuccess && (
          <div className="success-message">Deck saved successfully!</div>
        )}
        
        <div className="deck-content">
          <div className="card-list-container">
            <h2>Cards in Deck</h2>
            
            {deckCards.length === 0 ? (
              <div className="empty-deck-message">
                <p>This deck is empty. Click "Add Cards" to start building your deck.</p>
              </div>
            ) : (
              <div className="card-list">
                {deckCards.map(card => (
                  <div key={card.cardId} className="card-list-item">
                    <div className="card-info">
                      <span className="card-name">{card.cardName}</span>
                      <span className="card-type">{card.cardType}</span>
                      <span className="card-mana">{card.manaCost}</span>
                    </div>
                    <div className="card-actions">
                      <div className="quantity-control">
                        <button 
                          className="quantity-btn decrease" 
                          onClick={() => handleUpdateCardQuantity(card.cardId, card.nCopies - 1)}
                        >
                          -
                        </button>
                        <span className="quantity">{card.nCopies}</span>
                        <button 
                          className="quantity-btn increase" 
                          onClick={() => handleUpdateCardQuantity(card.cardId, card.nCopies + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button 
                        className="remove-btn" 
                        onClick={() => handleRemoveCard(card.cardId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal para añadir cartas */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content edit-modal">
            <h2>Add Cards to Deck</h2>
            
            <div className="search-container">
              <SearchBar onSearch={handleSearch} />
            </div>
            
            <div className="search-results-container">
              {searchLoading ? (
                <div className="loading-spinner">Searching cards...</div>
              ) : hasSearched && searchResults.length === 0 ? (
                <div className="no-results">No cards found matching your search criteria.</div>
              ) : hasSearched ? (
                <div className="search-results">
                  {searchResults.map(card => (
                    <div 
                      key={card.cardId} 
                      className={`search-result-item ${selectedCard?.cardId === card.cardId ? 'selected' : ''}`}
                      onClick={() => handleCardSelect(card)}
                    >
                      <div className="card-info">
                        <span className="card-name">{card.name}</span>
                        <span className="card-type">{card.cardType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            
            {selectedCard && (
              <div className="selected-card-info">
                <h3>Selected Card: {selectedCard.name}</h3>
                <div className="quantity-selector">
                  <label htmlFor="quantity">Quantity:</label>
                  <input 
                    type="number" 
                    id="quantity" 
                    min="1" 
                    value={quantity} 
                    onChange={handleQuantityChange} 
                  />
                </div>
              </div>
            )}
            
            <div className="modal-actions">
              <button className="cancel-button" onClick={closeEditModal}>
                Cancel
              </button>
              <button 
                className="add-button" 
                onClick={handleAddCard}
                disabled={!selectedCard}
              >
                Add to Deck
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckEditor;
