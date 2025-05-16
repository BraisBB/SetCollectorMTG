import React, { useState, useEffect, useCallback } from 'react';
import './CardModal.css';
import { httpClient } from '../services/httpClient';
import { collectionService } from '../services';
import { Card as CardType } from '../services/types';

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
  collectionCount?: number; // Cantidad en la colección del usuario
}

interface SetInfo {
  setId: number;
  setCode: string;
  name: string;
}

interface CardModalProps {
  card: Card | null;
  onClose: () => void;
  isAuthenticated?: boolean;
  isCollectionPage?: boolean; // Indica si estamos en la página de colección
  onCardRemoved?: (cardId: number) => void; // Callback when a card is completely removed
  onCardCollectionUpdated?: (cardId: number, newCount: number) => void; // Callback when card count changes
}

const CardModal: React.FC<CardModalProps> = ({ 
  card, 
  onClose, 
  isAuthenticated = false,
  isCollectionPage = false, // Por defecto, asumimos que no estamos en la página de colección
  onCardRemoved = () => {}, // Función vacía por defecto
  onCardCollectionUpdated = () => {} // Función vacía por defecto
}) => {
  const [sets, setSets] = useState<SetInfo[]>([]);
  const [fullCardData, setFullCardData] = useState<Card | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [collectionCount, setCollectionCount] = useState<number>(0);
  const [copiesCount, setCopiesCount] = useState<number>(1);
  const [addingToCollection, setAddingToCollection] = useState<boolean>(false);

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
        const sets = await httpClient.get<SetInfo[]>('sets');
        setSets(sets);
      } catch (error) {
        console.error('Error fetching sets:', error);
      }
    };

    fetchSets();
  }, []);

  // Cargar los detalles completos de la carta y la cantidad en la colección cuando se selecciona
  useEffect(() => {
    if (card && card.cardId) {
      setLoading(true);
      setError(null);
      
      const fetchCardData = async () => {
        try {
          console.log(`Fetching card details for ID: ${card.cardId}`);
          const cardDetails = await httpClient.get<Card>(`cards/${card.cardId}`);
          console.log('Fetched card data:', cardDetails);
          
          // Mezclamos los datos de la carta que ya tenemos con los detalles adicionales
          const mergedData = {
            ...cardDetails,
            // Si la carta ya tiene información sobre la cantidad en la colección, la conservamos
            collectionCount: card.collectionCount
          };
          
          setFullCardData(mergedData);
          
          // Si la carta ya tiene un contador de colección, lo usamos
          if (card.collectionCount !== undefined) {
            console.log(`Card already has collection count: ${card.collectionCount}`);
            setCollectionCount(card.collectionCount);
            // Si ya tiene copias, establecemos el contador en 1 para añadir más
            setCopiesCount(1);
          }
          // Si el usuario está autenticado y no tenemos información de colección, la consultamos
          else if (isAuthenticated) {
            try {
              console.log(`Checking if card ${card.cardId} is in user's collection`);
              const quantity = await collectionService.getCardInCollection(card.cardId);
              console.log(`Card ${card.cardId} quantity in collection: ${quantity}`);
              setCollectionCount(quantity);
              // Si ya tiene copias, establecemos el contador en 1 para añadir más
              setCopiesCount(1);
            } catch (collectionError: any) {
              console.error('Error fetching collection info:', collectionError);
              if (collectionError.message?.includes('Authentication failed')) {
                setError('Your session has expired. Please login again.');
              } else {
                // Para errores de colección, simplemente asumimos que no tiene la carta
                setCollectionCount(0);
              }
            }
          } else {
            console.log('User not authenticated, skipping collection info');
          }
        } catch (err: any) {
          console.error('Error fetching card details:', err);
          setError('Could not load the complete card details');
          // Usamos los datos parciales que ya tenemos
          setFullCardData(card);
          
          // Si la carta ya tiene un contador de colección, lo usamos aunque fallara la carga de detalles
          if (card.collectionCount !== undefined) {
            setCollectionCount(card.collectionCount);
          }
        } finally {
          setLoading(false);
        }
      };

      fetchCardData();
    } else {
      setFullCardData(null);
    }
  }, [card, isAuthenticated]);

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

  const handleAddToCollection = async () => {
    if (!card || !isAuthenticated) {
      if (!isAuthenticated) {
        setError('You need to be logged in to add cards to your collection');
      }
      return;
    }
    
    setAddingToCollection(true);
    setError(null);
    
    try {
      console.log(`Adding/updating card ${card.cardId} in collection`);
      
      if (collectionCount > 0) {
        // Ya existe en la colección, actualizar cantidad
        console.log(`Card already in collection (${collectionCount}), updating to ${collectionCount + copiesCount}`);
        await collectionService.updateCardQuantity(card.cardId, collectionCount + copiesCount);
      } else {
        // Añadir por primera vez
        console.log(`Adding card to collection for the first time (${copiesCount} copies)`);
        await collectionService.addCardToCollection(card.cardId, copiesCount);
      }
      
      // Actualizar contador local
      const newCount = collectionCount + copiesCount;
      console.log(`Collection updated, new count: ${newCount}`);
      setCollectionCount(newCount);
      setCopiesCount(1); // Resetear el contador de copias a añadir
      
      // Notificar al componente padre sobre la actualización
      if (isCollectionPage && onCardCollectionUpdated) {
        console.log(`Notifying parent component about collection update for card ${card.cardId}`);
        onCardCollectionUpdated(card.cardId, newCount);
      }
    } catch (error: any) {
      console.error('Error updating collection:', error);
      
      if (error.message?.includes('Authentication failed')) {
        setError('Your session has expired. Please login again.');
      } else {
        setError(`Failed to update your collection: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setAddingToCollection(false);
    }
  };

  const handleRemoveFromCollection = async () => {
    if (!card || !isAuthenticated || collectionCount === 0) {
      if (!isAuthenticated) {
        setError('You need to be logged in to manage your collection');
      }
      return;
    }
    
    setAddingToCollection(true);
    setError(null);
    
    try {
      console.log(`Removing/decreasing card ${card.cardId} from collection`);
      
      if (collectionCount === 1) {
        // Eliminar completamente
        console.log('Removing the last copy from collection');
        await collectionService.removeCardFromCollection(card.cardId);
        setCollectionCount(0);
        
        // Notificar que la carta ha sido eliminada completamente
        if (isCollectionPage && onCardRemoved) {
          console.log(`Notifying removal of card ${card.cardId} from collection`);
          onCardRemoved(card.cardId);
        }
      } else {
        // Reducir cantidad
        console.log(`Decreasing quantity from ${collectionCount} to ${collectionCount - 1}`);
        await collectionService.updateCardQuantity(card.cardId, collectionCount - 1);
        setCollectionCount(prevCount => {
          const newCount = prevCount - 1;
          
          // Notificar al componente padre sobre la actualización
          if (isCollectionPage && onCardCollectionUpdated) {
            console.log(`Notifying parent component about collection update for card ${card.cardId}`);
            onCardCollectionUpdated(card.cardId, newCount);
          }
          
          return newCount;
        });
      }
      
      console.log('Collection updated successfully');
    } catch (error: any) {
      console.error('Error updating collection:', error);
      
      if (error.message?.includes('Authentication failed')) {
        setError('Your session has expired. Please login again.');
      } else {
        setError(`Failed to update your collection: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setAddingToCollection(false);
    }
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
    <div className="card-modal-overlay" onClick={handleOverlayClick}>
      <div className="card-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close button with CSS styles */}
        <button 
          id="modal-close-button"
          type="button"
          className="close-button" 
          onClick={() => onClose()}
          aria-label="Close modal"
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
            <p>Loading card details...</p>
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
                    console.log(`Error cargando imagen para ${displayCard.name}: ${displayCard.imageUrl}`);
                    
                    // Si la URL original era de Scryfall, verificar su formato
                    const originalSrc = displayCard.imageUrl;
                    if (originalSrc.includes('api.scryfall.com/cards/')) {
                      // Verificar si es una URL de Scryfall mal formada
                      if (originalSrc.includes('&type=card') && !originalSrc.includes('?format=image')) {
                        console.log('URL de Scryfall incorrecta');
                      } else {
                        // Es una URL de Scryfall válida pero que falló por otra razón - posible problema de CORS
                        console.log('URL de Scryfall válida pero falló la carga, posible problema de CORS');
                        
                        // Extraer el ID de Scryfall de la URL
                        const scryfallIdMatch = originalSrc.match(/\/cards\/([^/?]+)/);
                        if (scryfallIdMatch && scryfallIdMatch[1]) {
                          const scryfallId = scryfallIdMatch[1];
                          // Intentar con el formato alternativo de URL de Scryfall
                          const correctedUrl = `https://cards.scryfall.io/normal/front/${scryfallId[0]}/${scryfallId}.jpg`;
                          console.log(`Intentando URL alternativa de Scryfall: ${correctedUrl}`);
                          target.src = correctedUrl;
                          // Si esta URL alternativa también falla, entonces pasar al respaldo
                          target.onerror = () => {
                            const backupUrl = `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${displayCard.cardId || 0}&type=card`;
                            console.log(`URL alternativa fallida, usando respaldo Gatherer: ${backupUrl}`);
                            target.src = backupUrl;
                            
                            // Si el respaldo también falla, usar un placeholder genérico
                            target.onerror = () => {
                              console.log('Respaldo Gatherer fallido, usando placeholder genérico');
                              target.src = 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=0&type=card';
                              target.classList.add('image-error');
                              target.onerror = null; // Prevenir bucle infinito
                            };
                          };
                          return;
                        }
                      }
                    }
                    
                    // Si no es una URL de Scryfall o no pudimos extraer el ID, usar respaldo de Gatherer
                    const backupUrl = `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${displayCard.cardId || 0}&type=card`;
                    console.log(`Usando URL de respaldo: ${backupUrl}`);
                    target.src = backupUrl;
                    
                    // Si la imagen de respaldo también falla, usar placeholder genérico
                    target.onerror = () => {
                      console.log(`Error en URL de respaldo, usando placeholder genérico`);
                      target.src = 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=0&type=card';
                      target.classList.add('image-error');
                      target.onerror = null; // Prevenir bucle infinito
                    };
                  }}
                />
              ) : (
                <div className="image-placeholder">
                  <span>{displayCard.name}</span>
                </div>
              )}
              
              {/* Collection Controls - Posicionados debajo de la imagen */}
              {isAuthenticated && (
                <div className="image-overlay-controls">
                  <div className="minimal-controls">
                    <button 
                      className="minimal-btn remove-btn"
                      onClick={handleRemoveFromCollection}
                      disabled={addingToCollection || collectionCount === 0}
                      title="Quitar de colección"
                    >
                      −
                    </button>
                    
                    <div className="minimal-copies">
                      <button 
                        className="minimal-btn copy-change"
                        onClick={() => setCopiesCount(prev => Math.max(1, prev - 1))}
                        disabled={addingToCollection || copiesCount <= 1}
                        title="Disminuir cantidad"
                      >
                        −
                      </button>
                      <span className="minimal-copy-count">{copiesCount}</span>
                      <button 
                        className="minimal-btn copy-change"
                        onClick={() => setCopiesCount(prev => prev + 1)}
                        disabled={addingToCollection}
                        title="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>
                    
                    <button 
                      className="minimal-btn add-btn"
                      onClick={handleAddToCollection}
                      disabled={addingToCollection}
                      title="Añadir a colección"
                    >
                      +
                    </button>
                  </div>
                  
                  {collectionCount > 0 && (
                    <div className="copies-display">
                      <span>Copies: {collectionCount}</span>
                    </div>
                  )}
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

// Función auxiliar para formatear los símbolos de mana en HTML
const formatManaCost = (manaCost: string): string => {
  // Reemplazar símbolos como {W}, {U}, {B}, {R}, {G} con clases de mana de MTG
  return manaCost
    .replace(/{W}/g, '<i class="ms ms-w ms-cost"></i>')
    .replace(/{U}/g, '<i class="ms ms-u ms-cost"></i>')
    .replace(/{B}/g, '<i class="ms ms-b ms-cost"></i>')
    .replace(/{R}/g, '<i class="ms ms-r ms-cost"></i>')
    .replace(/{G}/g, '<i class="ms ms-g ms-cost"></i>')
    .replace(/{C}/g, '<i class="ms ms-c ms-cost"></i>')
    .replace(/{T}/g, '<i class="ms ms-tap ms-cost"></i>')
    .replace(/{X}/g, '<i class="ms ms-x ms-cost"></i>')
    .replace(/{(\d+)}/g, '<i class="ms ms-$1 ms-cost"></i>');
};

export default CardModal;