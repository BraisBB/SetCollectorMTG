import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import { apiService } from '../services';
import DeckCardSelector from '../components/DeckCardSelector';
import { Deck, CardDeck } from '../services/types';
import './DeckEditor.css';

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
        navigate(`/deck/${deckId}`);
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
            <h1>{deck.deckName}</h1>
            <div className="deck-meta">
              <span className="deck-type">{deck.gameType}</span>
              <span className="deck-color">{deck.deckColor || 'No color'}</span>
              <span className="card-count">{deck.totalCards} cards</span>
            </div>
          </div>
          <div className="deck-actions">
            <button 
              className="save-button" 
              onClick={handleSaveDeck}
            >
              {isEditMode ? 'Save & Exit' : 'Save Deck'}
            </button>
            <button 
              className="back-button" 
              onClick={handleBackToCollection}
            >
              Back to Collection
            </button>
          </div>
        </div>
        
        {saveSuccess && (
          <div className="success-message">Deck saved successfully!</div>
        )}
        
        <div className="deck-content">
          {/* Integración del nuevo selector de cartas */}
          <DeckCardSelector 
            deckId={parseInt(deckId!)} 
            cards={deckCards}
            onCardsUpdated={refreshDeckData}
          />
        </div>
      </div>
    </div>
  );
};

export default DeckEditor;
