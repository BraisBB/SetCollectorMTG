import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, authService } from '../services';
import { Deck, DeckCreateDto } from '../services/types';
import './DeckList.css';

interface DeckListProps {
  decks: Deck[];
  onDeckCreated: () => void;
  onDeckDeleted: () => void;
}

const DeckList: React.FC<DeckListProps> = ({ decks, onDeckCreated, onDeckDeleted }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDeck, setNewDeck] = useState<DeckCreateDto>({
    deckName: '',
    gameType: 'STANDARD',
    deckColor: '' // Sin valor predeterminado
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDeckClick = (deckId: number) => {
    navigate(`/deck/${deckId}`);
  };
  
  const handleDelete = async (deckId: number) => {
    try {
      await apiService.deleteDeck(deckId);
      onDeckDeleted();
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error deleting deck:', error.message);
      } else {
        console.error('Unknown error deleting deck');
      }
    }
  };

  const handleEditDeck = (deck: Deck) => {
    navigate(`/deck/${deck.deckId}`);
  };

  const openCreateModal = () => {
    setIsModalOpen(true);
    setError(null);
    setNewDeck({
      deckName: '',
      gameType: 'STANDARD',
      deckColor: ''
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDeck(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const userId = authService.getUserId();
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      await apiService.createDeck({
        ...newDeck
      });
      
      setIsModalOpen(false);
      setNewDeck({
        deckName: '',
        gameType: 'STANDARD',
        deckColor: ''
      });
      onDeckCreated();
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error creating deck:', error.message);
        setError(error.message);
      } else {
        console.error('Unknown error creating deck');
        setError('Failed to create deck. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="deck-list-container">
      <div className="deck-list-header">
        <h2>My Decks</h2>
        <button className="create-deck-button" onClick={openCreateModal}>
          Create Deck
        </button>
      </div>
      
      {decks.length === 0 ? (
        <div className="no-decks-message">
          <p>You don't have any decks yet. Create your first deck to start building!</p>
        </div>
      ) : (
        <div className="decks-grid">
          {decks.map(deck => (
            <div 
              key={deck.deckId} 
              className={`deck-card ${deck.gameType.toLowerCase()}`}
              onClick={() => handleDeckClick(deck.deckId)}
            >
              <h3>{deck.deckName}</h3>
              <div className="deck-info">
                <span className="deck-type">{deck.gameType}</span>
                <span className="deck-color">
                  {deck.deckColor === null || deck.deckColor === '' ? 
                    'Sin color (añade cartas)' : 
                    deck.deckColor}
                </span>
                <span className="card-count">{deck.totalCards} cards</span>
              </div>
              <div className="deck-actions">
                <button 
                  className="edit-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditDeck(deck);
                  }}
                >
                  Edit
                </button>
                <button 
                  className="delete-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(deck.deckId);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal para crear nuevo deck */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create New Deck</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="deckName">Deck Name</label>
                <input
                  type="text"
                  id="deckName"
                  name="deckName"
                  value={newDeck.deckName}
                  onChange={handleInputChange}
                  placeholder="Enter deck name"
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="gameType">Game Type</label>
                <select
                  id="gameType"
                  name="gameType"
                  value={newDeck.gameType}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="STANDARD">Standard</option>
                  <option value="COMMANDER">Commander</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="create-button"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Deck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckList;
