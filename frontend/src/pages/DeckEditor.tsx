import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import { apiService } from '../services';
import DeckCardSelector from '../components/DeckCardSelector';
import { Deck, CardDeck } from '../services/types';
import './DeckEditor.css';

// Componente para mostrar símbolos de mana para los colores
const DeckColorDisplay = ({ deckColor }: { deckColor: string | null }) => {
  if (!deckColor) return <span className="deck-color">Sin color</span>;
  
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
    <span className="deck-color">
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
    </span>
  );
};

const DeckEditor: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.pathname.endsWith('/edit');
  
  const [deck, setDeck] = useState<Deck | null>(null);
  const [deckCards, setDeckCards] = useState<CardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [isDeckSelectorEditMode, setIsDeckSelectorEditMode] = useState(false);

  // Cargar datos del deck con sistema de reintentos
  useEffect(() => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 segundo
    
    const fetchDeckData = async () => {
      if (!deckId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Cargando mazo con ID: ${deckId} (intento ${retryCount + 1})`);
        const deckData = await apiService.getDeckById(parseInt(deckId));
        setDeck(deckData);
        
        console.log(`Cargando cartas del mazo con ID: ${deckId}`);
        const cardsData = await apiService.getCardsByDeck(parseInt(deckId));
        setDeckCards(cardsData);
        console.log(`Se obtuvieron ${cardsData.length} cartas para el mazo`);
        
        // Reiniciar contador de reintentos si todo funciona
        setRetryCount(0);
      } catch (err: any) {
        console.error('Error fetching deck data:', err);
        
        if (retryCount < MAX_RETRIES) {
          console.log(`Reintentando en ${RETRY_DELAY}ms (intento ${retryCount + 1}/${MAX_RETRIES})...`);
          setRetryCount(prev => prev + 1);
          
          // Programar un reintento después de un retraso
          setTimeout(() => {
            fetchDeckData();
          }, RETRY_DELAY);
          
          return;
        }
        
        setError('Failed to load deck data. Please try again.');
      } finally {
        if (retryCount >= MAX_RETRIES || !error) {
          setLoading(false);
        }
      }
    };
    
    fetchDeckData();
  }, [deckId, retryCount]);

  // Refrescar datos del mazo
  const refreshDeckData = async () => {
    if (!deckId) return;
    
    try {
      console.log(`Refrescando datos del mazo: ${deckId}`);
      const cardsData = await apiService.getCardsByDeck(parseInt(deckId));
      console.log("Datos de cartas recibidos:", JSON.stringify(cardsData));
      setDeckCards(cardsData);
      
      const deckData = await apiService.getDeckById(parseInt(deckId));
      setDeck(deckData);
    } catch (err: any) {
      console.error('Error refreshing deck data:', err);
      // No mostrar error al usuario durante refrescos silenciosos
    }
  };

  // Guardar cambios en el deck
  const handleSaveDeck = async () => {
    if (!deck || !deckId) return;
    
    try {
      // Actualizamos solo metadata del deck, las cartas ya se actualizan individualmente
      await apiService.updateDeck(parseInt(deckId), deck);
      setSaveSuccess(true);
      
      // Si estamos en modo edición, volver a la vista normal
      if (isEditMode) {
        navigate(`/decks/${deckId}`);
        return;
      }
      
      // Mostrar mensaje de éxito por 3 segundos
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving deck:', err);
      setError('Failed to save deck. Please try again.');
    }
  };

  // Iniciar edición del nombre
  const handleEditName = () => {
    if (deck) {
      setNewDeckName(deck.deckName);
      setIsEditingName(true);
    }
  };

  // Guardar el nuevo nombre
  const handleSaveName = () => {
    if (deck && newDeckName.trim()) {
      setDeck({
        ...deck,
        deckName: newDeckName.trim()
      });
      setIsEditingName(false);
    }
  };

  // Cancelar edición de nombre
  const handleCancelNameEdit = () => {
    setIsEditingName(false);
  };

  // Volver a la página de colección
  const handleBackToCollection = () => {
    navigate('/collection');
  };

  // Reintentar carga de datos
  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    setLoading(true);
  };

  // Callback para cuando cambia el modo de edición en DeckCardSelector
  const handleDeckSelectorEditModeChange = (isEditMode: boolean) => {
    setIsDeckSelectorEditMode(isEditMode);
    
    // Si salimos del modo edición y hubo cambios en el nombre, guardar el deck
    if (!isEditMode && deck) {
      handleSaveDeck();
    }
  };

  if (loading) {
    return (
      <div className="deck-editor-page">
        <Header />
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading deck data... {retryCount > 0 ? `(Attempt ${retryCount}/${3})` : ''}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="deck-editor-page">
        <Header />
        <div className="container">
          <div className="error-message">
            <p>{error || 'Deck not found'}</p>
            <button className="retry-button" onClick={handleRetry}>
              Retry
            </button>
          </div>
          <button className="back-button" onClick={handleBackToCollection}>
            Back to Collection
          </button>
        </div>
      </div>
    );
  }

  // Si el mazo no pertenece al usuario actual, mostrar error
  if (deck.deckName === 'Mazo no encontrado') {
    return (
      <div className="deck-editor-page">
        <Header />
        <div className="container">
          <div className="error-message">
            <p>You don't have access to this deck or it doesn't exist.</p>
          </div>
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
            {isEditingName ? (
              <div className="deck-name-edit">
                <input
                  type="text"
                  className="deck-name-input"
                  value={newDeckName}
                  onChange={e => setNewDeckName(e.target.value)}
                  autoFocus
                />
                <div className="name-edit-actions">
                  <button className="name-save-button" onClick={handleSaveName}>Save</button>
                  <button className="name-cancel-button" onClick={handleCancelNameEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <h1>
                {deck.deckName}
                {isDeckSelectorEditMode && (
                  <button
                    onClick={handleEditName}
                    className="edit-name-button"
                    title="Edit deck name"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                )}
              </h1>
            )}
            <div className="deck-meta">
              <span className="deck-type">
                {deck.gameType}
              </span>
              <DeckColorDisplay deckColor={deck.deckColor} />
              <span className="card-count">
                {deck.totalCards} cards
              </span>
            </div>
          </div>
          <div className="deck-actions">
            <button className="save-button" onClick={handleSaveDeck}>
              Save
            </button>
            <button className="back-button" onClick={handleBackToCollection}>
              Back
            </button>
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button className="retry-button" onClick={handleRetry}>
              Retry
            </button>
          </div>
        )}
        
        {saveSuccess && (
          <div className="success-message">
            Deck saved successfully!
          </div>
        )}
        
        <div className="deck-content">
          <div className="card-list-container">
            <DeckCardSelector 
              deckId={parseInt(deckId || '0')} 
              cards={deckCards} 
              onCardsUpdated={refreshDeckData}
              deckGameType={deck.gameType} 
              onEditModeChange={handleDeckSelectorEditModeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckEditor;
