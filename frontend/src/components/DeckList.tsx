import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, authService } from '../services';
import { Deck, DeckCreateDto } from '../services/types';
import './DeckList.css';

// Componente para mostrar símbolos de mana para los colores
const DeckColorDisplay = ({ deckColor }: { deckColor: string | null }) => {
  if (!deckColor) return null;
  
  // Mapeo de nombres de colores a símbolos de mana
  const colorToManaSymbol: Record<string, string> = {
    white: 'W',
    blue: 'U',
    black: 'B',
    red: 'R',
    green: 'G',
    colorless: 'C'
  };
  
  // Separar colores si hay múltiples
  const colors = deckColor.split(' ');
  
  return (
    <div className="deck-card-colors">
      {colors.map((color, index) => {
        // Obtener el símbolo de mana correspondiente al color
        const manaSymbol = colorToManaSymbol[color];
        
        if (!manaSymbol) return null;
        
        return (
          <label 
            key={index} 
            className="color-check-label"
            title={color.charAt(0).toUpperCase() + color.slice(1)}
          >
            <i className={`ms ms-${manaSymbol.toLowerCase()} color-icon`}></i>
          </label>
        );
      })}
    </div>
  );
};

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
      // No hacemos nada más, ya que el componente padre manejará el modal
      return;
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
    console.log("DeckList: Form onSubmit event captured");
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
      {decks.length === 0 ? (
        <div className="no-decks-message">
          <p>You don't have any decks yet. Create your first deck to start building!</p>
          <button 
            onClick={() => {
              console.log("DeckList: Botón alternativo para crear mazo clickeado");
              openCreateModal();
            }}
            className="create-deck-button create-deck-button-large"
          >
            Create Your First Deck
          </button>
        </div>
      ) : (
        <div className="decks-grid">
          {decks.map(deck => (
            <div 
              key={deck.deckId} 
              className={`deck-card ${deck.gameType.toLowerCase()} deck-card-style`}
              onClick={() => handleDeckClick(deck.deckId)}
            >
              <h3 className="deck-card-title">
                {deck.deckName}
              </h3>
              <div className="deck-info deck-info-style">
                <span className={`deck-type deck-type-style deck-type-${deck.gameType.toLowerCase()}`}>
                  {deck.gameType}
                </span>
                <DeckColorDisplay deckColor={deck.deckColor} />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal para crear nuevo deck - Solo se muestra si no hay un setShowCreateModal externo */}
      {(isModalOpen || showCreateModal) && !setShowCreateModal && (
        <div 
          className="modal-overlay modal-overlay-style" 
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div 
            className="modal-content modal-content-style" 
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">Create New Deck</h2>
            
            {error && (
              <div 
                className="error-message error-message-style"
              >
                {error}
              </div>
            )}
            
            <form id="create-deck-form" onSubmit={(e) => {
              console.log("DeckList: Form onSubmit event captured");
              handleSubmit(e);
            }}>
              <div className="form-group form-group-style">
                <label 
                  htmlFor="deckName"
                  className="form-label"
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
                  className="form-input"
                />
              </div>
              
              <div className="form-group form-group-style">
                <label 
                  htmlFor="gameType"
                  className="form-label"
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
                  className="form-input"
                >
                  <option value="STANDARD">Standard</option>
                  <option value="COMMANDER">Commander</option>
                </select>
              </div>
              
              <div 
                className="form-actions form-actions-style"
              >
                <button 
                  type="button" 
                  className="cancel-button cancel-button-style" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("DeckList: Botón Cancel clickeado");
                    closeModal();
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="create-button create-button-style"
                  disabled={loading}
                  onClick={(e) => {
                    console.log("DeckList: Botón Create Deck (submit) clickeado");
                    // No necesitamos llamar a handleSubmit aquí ya que es un botón de tipo submit
                    // y el formulario ya tiene un controlador onSubmit
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
