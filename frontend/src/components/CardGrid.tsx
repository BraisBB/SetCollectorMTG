import './CardGrid.css';
import { useState } from 'react';
import CardModal from './CardModal'; // Asegúrate de que el componente CardModal esté en el mismo directorio o ajusta la ruta según sea necesario

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
}

interface CardGridProps {
  cards: Card[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const CardGrid = ({ cards, loading, hasMore, onLoadMore }: CardGridProps) => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
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
              />
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
      />
    </div>
  );
};

export default CardGrid; 