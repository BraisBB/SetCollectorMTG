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
}

const CardGrid = ({ cards, loading, hasMore, onLoadMore, isAuthenticated = false, isCollectionPage = false, onCardRemoved }: CardGridProps) => {
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
    console.log(`Error cargando imagen para ${cardName} (ID: ${cardId}): ${target.src}`);
    
    // Si la URL original era de Scryfall, verificar su formato
    const originalSrc = target.src;
    if (originalSrc.includes('api.scryfall.com/cards/')) {
      // Verificar si es una URL de Scryfall mal formada (cardId&type=card en lugar del scryfallId)
      if (originalSrc.includes('&type=card') && !originalSrc.includes('?format=image')) {
        console.log(`URL de Scryfall incorrecta, usando respaldo de Gatherer`);
      } else {
        // Es una URL de Scryfall válida pero que falló por otra razón - posible problema de CORS
        console.log(`URL de Scryfall válida pero falló la carga, posible problema de CORS`);
        
        // Extraer el ID de Scryfall de la URL
        const scryfallIdMatch = originalSrc.match(/\/cards\/([^/?]+)/);
        if (scryfallIdMatch && scryfallIdMatch[1]) {
          const scryfallId = scryfallIdMatch[1];
          // Intentar con el formato correcto de URL de Scryfall
          const correctedUrl = `https://cards.scryfall.io/normal/front/${scryfallId[0]}/${scryfallId}.jpg`;
          console.log(`Intentando URL alternativa de Scryfall: ${correctedUrl}`);
          target.src = correctedUrl;
          return; // Salir para darle la oportunidad a esta URL
        }
      }
    }
    
    // Si llegamos aquí, usar respaldo de Gatherer
    const backupUrl = `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${cardId}&type=card`;
    console.log(`Usando URL de respaldo: ${backupUrl}`);
    target.src = backupUrl;
    
    // Si la imagen de respaldo también falla, usar placeholder genérico de mtg
    target.onerror = () => {
      console.log(`Error en URL de respaldo, usando placeholder genérico`);
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
      />
    </div>
  );
};

export default CardGrid; 