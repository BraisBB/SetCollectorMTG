import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, authService } from '../services';
import { Deck, DeckCreateDto } from '../services/types';
import './DeckList.css';

interface DeckListProps {
  decks: Deck[];
  onDeckCreated: () => void;
  onDeckDeleted: () => void;
  showCreateModal?: boolean;
  setShowCreateModal?: React.Dispatch<React.SetStateAction<boolean>>;
}

const DeckList: React.FC<DeckListProps> = ({ 
  decks, 
  onDeckCreated, 
  onDeckDeleted,
  showCreateModal = false,
  setShowCreateModal
}) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDeck, setNewDeck] = useState<DeckCreateDto>({
    deckName: '',
    gameType: 'STANDARD',
    deckColor: '' // Sin valor predeterminado
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Usamos useEffect para sincronizar el estado externo con el interno
  useEffect(() => {
    // Si showCreateModal es proporcionado desde las props, usamos ese
    if (setShowCreateModal !== undefined) {
      console.log("DeckList: detectado cambio en showCreateModal a:", showCreateModal);
      if (showCreateModal && !isModalOpen) {
        console.log("DeckList: abriendo modal desde props");
        openCreateModal();
      } else if (!showCreateModal && isModalOpen) {
        console.log("DeckList: cerrando modal desde props");
        closeModal();
      }
    }
  }, [showCreateModal]);

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
    console.log("DeckList: Abriendo modal para crear mazo");
    setIsModalOpen(true);
    // Si hay un setShowCreateModal desde props, lo actualizamos también
    if (setShowCreateModal) {
      setShowCreateModal(true);
    }
    setError(null);
    setNewDeck({
      deckName: '',
      gameType: 'STANDARD',
      deckColor: ''
    });
  };

  const closeModal = () => {
    console.log("DeckList: Cerrando modal");
    setIsModalOpen(false);
    // Si hay un setShowCreateModal desde props, lo actualizamos también
    if (setShowCreateModal) {
      setShowCreateModal(false);
    }
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
    console.log("DeckList: Formulario enviado, evitando comportamiento por defecto");
    setLoading(true);
    setError(null);
    
    try {
      // Validación de campos obligatorios
      if (!newDeck.deckName?.trim()) {
        console.warn("DeckList: Error de validación: Nombre de mazo vacío");
        setError('El nombre del mazo es obligatorio');
        setLoading(false);
        return;
      }
      
      console.log("DeckList: Validación de formulario completada correctamente");
      
      // Obtener ID de usuario
      const userId = authService.getUserIdentifier();
      console.log("DeckList: ID de usuario autenticado:", userId);
      
      if (!userId) {
        console.error("DeckList: Error: No se pudo obtener el ID de usuario");
        throw new Error('No se pudo determinar el ID del usuario');
      }
      
      // Asegurarnos que gameType sea un valor válido
      if (newDeck.gameType !== 'STANDARD' && newDeck.gameType !== 'COMMANDER') {
        console.warn(`DeckList: Tipo de mazo no reconocido: ${newDeck.gameType}, usando STANDARD por defecto`);
        newDeck.gameType = 'STANDARD';
      }
      
      console.log("DeckList: Enviando petición al API:", {
        deckName: newDeck.deckName,
        gameType: newDeck.gameType,
        deckColor: newDeck.deckColor
      });
      
      try {
        const createdDeck = await apiService.createDeck({
          ...newDeck
        });
        
        console.log("DeckList: Mazo creado con éxito:", createdDeck);
        
        // Cerrar modal y resetear formulario
        setIsModalOpen(false);
        if (setShowCreateModal) {
          setShowCreateModal(false);
        }
        setNewDeck({
          deckName: '',
          gameType: 'STANDARD',
          deckColor: ''
        });
        
        // Notificar al componente padre
        console.log("DeckList: Notificando creación exitosa al componente padre");
        onDeckCreated();
      } catch (apiError: any) {
        console.error("DeckList: Error específico de la API al crear mazo:", apiError);
        if (apiError.response) {
          console.error("DeckList: Datos de respuesta:", apiError.response.data);
          console.error("DeckList: Estado HTTP:", apiError.response.status);
          setError(`Error del servidor: ${apiError.response.data?.message || apiError.response.statusText || 'Error desconocido'}`);
        } else {
          setError(`Error de red: ${apiError.message || 'No se pudo conectar con el servidor'}`);
        }
        throw apiError; // Propagar para el catch general
      }
    } catch (error: any) {
      console.error('DeckList: Error general al crear mazo:', error);
      
      if (!error.handledAlready) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Error desconocido al crear el mazo');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="deck-list-container">
      <div className="deck-list-header">
        <h2>My Decks</h2>
        <button 
          className="create-deck-button" 
          onClick={() => {
            console.log("DeckList: Botón para crear mazo clickeado");
            openCreateModal();
          }}
          style={{ 
            padding: '0.8rem 1.5rem',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Create Deck +
        </button>
      </div>
      
      {decks.length === 0 ? (
        <div className="no-decks-message">
          <p>You don't have any decks yet. Create your first deck to start building!</p>
          <button 
            onClick={() => {
              console.log("DeckList: Botón alternativo para crear mazo clickeado");
              openCreateModal();
            }}
            className="create-deck-button"
            style={{ 
              marginTop: '1rem',
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              display: 'inline-block'
            }}
          >
            Create Your First Deck
          </button>
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
                    'No color (add cards)' : 
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
      {(isModalOpen || showCreateModal) && (
        <div 
          className="modal-overlay" 
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#494949',
              borderRadius: '8px',
              padding: '2rem',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              color: '#ffffff',
              zIndex: 10000,
              position: 'relative'
            }}
          >
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Create New Deck</h2>
            
            {error && (
              <div 
                className="error-message"
                style={{
                  backgroundColor: 'rgba(220, 53, 69, 0.1)',
                  border: '1px solid rgba(220, 53, 69, 0.3)',
                  color: '#dc3545',
                  padding: '0.8rem',
                  borderRadius: '4px',
                  marginBottom: '1.5rem'
                }}
              >
                {error}
              </div>
            )}
            
            <form id="create-deck-form" onSubmit={(e) => {
              console.log("DeckList: Evento onSubmit del formulario capturado");
              handleSubmit(e);
            }}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label 
                  htmlFor="deckName"
                  style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  Deck Name
                </label>
                <input
                  type="text"
                  id="deckName"
                  name="deckName"
                  value={newDeck.deckName}
                  onChange={handleInputChange}
                  placeholder="Enter deck name"
                  disabled={loading}
                  minLength={3}
                  maxLength={50}
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    backgroundColor: '#ffffff',
                    color: '#333'
                  }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label 
                  htmlFor="gameType"
                  style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  Game Type
                </label>
                <select
                  id="gameType"
                  name="gameType"
                  value={newDeck.gameType}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    backgroundColor: '#ffffff',
                    color: '#333'
                  }}
                >
                  <option value="STANDARD">Standard</option>
                  <option value="COMMANDER">Commander</option>
                </select>
              </div>
              
              <div 
                className="form-actions"
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                  marginTop: '2rem'
                }}
              >
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("DeckList: Botón Cancel clickeado");
                    closeModal();
                  }}
                  disabled={loading}
                  style={{
                    padding: '0.8rem 1.5rem',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    border: '1px solid #ddd',
                    color: '#ddd'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="create-button"
                  disabled={loading}
                  onClick={(e) => {
                    console.log("DeckList: Botón Create Deck (submit) clickeado");
                    // No necesitamos llamar a handleSubmit aquí ya que es un botón de tipo submit
                    // y el formulario ya tiene un controlador onSubmit
                  }}
                  style={{
                    padding: '0.8rem 1.5rem',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    backgroundColor: '#e65100',
                    color: 'white',
                    border: 'none',
                    minWidth: '120px'
                  }}
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
