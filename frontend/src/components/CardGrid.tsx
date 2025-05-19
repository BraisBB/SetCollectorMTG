import './CardGrid.css';
import { useState } from 'react';
import CardModal, { Card as CardModalType } from './CardModal'; // Importamos el tipo Card desde CardModal

export interface Card {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
  rarity: string;
  set: string;
  color: string;
  manaCost?: string;
  manaValue?: number;
  oracleText?: string;
  scryfallId?: string;
  collectionCount?: number; // Cantidad en la colección (opcional)
}

interface CardGridProps {
  cards: Card[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isAuthenticated?: boolean;
  isCollectionPage?: boolean; // Indica si estamos en la página de colección
  onCardRemoved?: (cardId: number) => void; // Callback cuando una carta es eliminada
  onCardCollectionUpdated?: (cardId: number, newCount: number) => void;
}

const CardGrid = ({ cards, loading, hasMore, onLoadMore, isAuthenticated = false, isCollectionPage = false, onCardRemoved, onCardCollectionUpdated }: CardGridProps) => {
  const [selectedCard, setSelectedCard] = useState<CardModalType | null>(null);

  const handleCardClick = (card: Card) => {
    // Adaptamos el objeto Card de CardGrid al formato esperado por CardModal
    const cardModalFormat: CardModalType = {
      cardId: parseInt(card.id, 10),
      name: card.name,
      rarity: card.rarity,
      cardType: card.type,
      imageUrl: card.imageUrl,
      oracleText: card.oracleText,
      manaCost: card.manaCost,
      manaValue: card.manaValue,
      scryfallId: card.scryfallId,
      set: card.set,
      color: card.color,
      // Si tenemos información sobre la cantidad en la colección, la pasamos al modal
      collectionCount: card.collectionCount
    };
    
    setSelectedCard(cardModalFormat);
  };

  // Función para manejar errores de carga de imágenes
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>, cardId: string, cardName: string) => {
    const target = event.target as HTMLImageElement;
    console.log(`Error loading image for ${cardName} (ID: ${cardId}): ${target.src}`);
    
    // Usar URL de respaldo de Gatherer
    const backupUrl = `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${cardId}&type=card`;
    console.log(`Using backup URL: ${backupUrl}`);
    target.src = backupUrl;
    
    // Si la imagen de respaldo también falla, usar placeholder genérico
    target.onerror = () => {
      console.log(`Error with backup URL, using generic placeholder`);
      // Usar una URL externa genérica para el placeholder
      target.src = 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=0&type=card';
      target.classList.add('image-error');
      target.onerror = null; // Prevenir bucle infinito
    };
  };

  if (loading && cards.length === 0) {
    return (
      <div className="cards-loading">
        <div className="spinner"></div>
        <p>Loading cards...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="no-cards-found">
        <p>No cards found. Try adjusting your search.</p>
      </div>
    );
  }

  return (
    <div className="card-grid-container">
      <h2 className="results-title">Search Results</h2>
      <div className="card-grid">
        {cards.map(card => (
          <div 
            key={card.id} 
            className="card-item" 
            onClick={() => handleCardClick(card)}
            role="button"
            tabIndex={0}
          >
            <div className="card-image-container">
              <img 
                src={card.imageUrl} 
                alt={card.name} 
                className="card-image"
                title={card.name}
                onError={(e) => handleImageError(e, card.id, card.name)}
              />
              {card.collectionCount && card.collectionCount > 0 && (
                <div className="card-collection-count">
                  <span>{card.collectionCount}x</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {loading && (
        <div className="load-more-loading">
          <div className="spinner"></div>
          <p>Loading more cards...</p>
        </div>
      )}
      
      {hasMore && !loading && (
        <div className="load-more-container">
          <button 
            className="load-more-button" 
            onClick={onLoadMore}
          >
            Load More
          </button>
        </div>
      )}
      <CardModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
        isAuthenticated={isAuthenticated}
        isCollectionPage={isCollectionPage}
        onCardRemoved={onCardRemoved}
        onCardCollectionUpdated={onCardCollectionUpdated}
      />
    </div>
  );
};

export default CardGrid; 