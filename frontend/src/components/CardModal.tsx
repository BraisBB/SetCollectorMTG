import React, { useState, useEffect, useCallback } from 'react';
import './CardModal.css';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

export interface Card {
  cardId: number;
  name: string;
  rarity: string;
  oracleText?: string;
  manaValue?: number;
  manaCost?: string;
  cardType: string;
  imageUrl: string;
  scryfallId?: string;
  set?: string;
  setId?: number;  // Añadimos setId para manejar explícitamente el ID del set
  type?: string;
  color?: string;
}

interface SetInfo {
  setId: number;
  setCode: string;
  name: string;
}

interface CardModalProps {
  card: Card | null;
  onClose: () => void;
}

const CardModal: React.FC<CardModalProps> = ({ card, onClose }) => {
  const [sets, setSets] = useState<SetInfo[]>([]);
  const [fullCardData, setFullCardData] = useState<Card | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Manejar cierre con useCallback para evitar recreaciones
  const handleClose = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Close button clicked");
    if (onClose) onClose();
  }, [onClose]);

  // Manejar cierre al hacer clic en el overlay
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      console.log("Overlay clicked");
      if (onClose) onClose();
    }
  }, [onClose]);

  // Añadir soporte para cerrar con la tecla Escape
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log("Escape key pressed");
        if (onClose) onClose();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  // Cargar los sets disponibles
  useEffect(() => {
    const fetchSets = async () => {
      try {
        const response = await axios.get<SetInfo[]>(`${API_BASE_URL}/sets`);
        setSets(response.data);
      } catch (error) {
        console.error('Error fetching sets:', error);
      }
    };

    fetchSets();
  }, []);

  // Cargar los detalles completos de la carta cuando se selecciona
  useEffect(() => {
    if (card && card.cardId) {
      setLoading(true);
      setError(null);
      
      const fetchFullCardData = async () => {
        try {
          console.log(`Fetching card details for ID: ${card.cardId}`);
          const response = await axios.get<Card>(`${API_BASE_URL}/cards/${card.cardId}`);
          console.log('Fetched card data:', response.data);
          setFullCardData(response.data);
        } catch (err) {
          console.error('Error fetching card details:', err);
          setError('No se pudieron cargar los detalles completos de la carta');
          // Usamos los datos parciales que ya tenemos
          setFullCardData(card);
        } finally {
          setLoading(false);
        }
      };

      fetchFullCardData();
    } else {
      setFullCardData(null);
    }
  }, [card]);

  const getSetName = (card: Card | null): string => {
    if (!card) return 'Unknown Set';
    
    // Intentar obtener el setId de varias formas posibles
    let setId: number | undefined;
    
    // Si tenemos setId directo
    if (card.setId !== undefined) {
      setId = card.setId;
    } 
    // Si tenemos set como string, intentar parsear como número
    else if (card.set) {
      const parsedId = parseInt(card.set, 10);
      if (!isNaN(parsedId)) {
        setId = parsedId;
      }
    }
    
    // Buscar el set por su ID
    if (setId !== undefined) {
      const foundSet = sets.find(set => set.setId === setId);
      if (foundSet) {
        return foundSet.name;
      }
    }
    
    // Si no encontramos el set, devolver el valor original o Unknown
    return card.set || 'Unknown Set';
  };

  // Usar fullCardData (datos completos de la carta) si está disponible, si no, usar card (datos parciales)
  const displayCard = fullCardData || card;

  if (!displayCard) return null;

  // Helper to format oracle text with proper line breaks and symbols
  const formatOracleText = (text?: string) => {
    if (!text?.trim()) return [<span key="empty" className="no-text-message">No oracle text available</span>];
    
    return text.split('\n').map((line, index) => (
      <p key={index} className="oracle-text-paragraph">{line}</p>
    ));
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Botón de cierre con eventos directos */}
        <button 
          type="button"
          className="close-button" 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
          aria-label="Cerrar modal"
        >
          &times;
        </button>
       
        <header className="modal-header">
          <h2 className="card-title">{displayCard.name}</h2>
          {displayCard.manaCost && (
            <div className="card-mana-cost" dangerouslySetInnerHTML={{ __html: formatManaCost(displayCard.manaCost) }} />
          )}
        </header>
        
        {loading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Cargando detalles de la carta...</p>
          </div>
        ) : (
          <div className="card-modal-layout">
            <div className="card-modal-image">
              {displayCard.imageUrl ? (
                <img
                  src={displayCard.imageUrl}
                  alt={displayCard.name}
                  className="modal-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-card.jpg';
                    target.classList.add('image-error');
                  }}
                />
              ) : (
                <div className="image-placeholder">
                  <span>{displayCard.name}</span>
                </div>
              )}
            </div>
           
            <div className="card-modal-details">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              
              <div className="card-details-section">
                <h3 className="section-title">Card Details</h3>
                <div className="card-details-grid">
                  <div className="card-detail-row">
                    <span className="card-detail-label">Type:</span>
                    <span className="card-detail-value">{displayCard.cardType || displayCard.type}</span>
                  </div>
                  
                  <div className="card-detail-row">
                    <span className="card-detail-label">Set:</span>
                    <span className="card-detail-value">
                      {getSetName(displayCard)}
                    </span>
                  </div>
                  
                  {displayCard.oracleText && (
                    <div className="card-detail-row oracle-text">
                      <span className="card-detail-label">Text:</span>
                      <div className="card-detail-value oracle-text-content"
                        style={{
                          whiteSpace: 'pre-wrap',
                          fontFamily: '"Noto Sans", sans-serif',
                          fontSize: '0.95rem',
                          lineHeight: '1.5',
                          minHeight: '60px',
                          overflowY: 'auto'
                        }}>
                        {formatOracleText(displayCard.oracleText)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {displayCard.scryfallId && (
                <div className="card-details-section">
                  <a 
                    href={`https://scryfall.com/card/${displayCard.scryfallId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="external-link scryfall-link"
                  >
                    View on Scryfall
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to format mana cost with proper icons
const formatManaCost = (manaCost: string): string => {
  // Replace {X}, {W}, {U}, etc. with span elements with the appropriate mana symbol classes
  return manaCost.replace(/{([^}]+)}/g, (match, symbol) => {
    const lowerSymbol = symbol.toLowerCase();
    return `<span class="ms ms-${lowerSymbol}"></span>`;
  });
};

export default CardModal;