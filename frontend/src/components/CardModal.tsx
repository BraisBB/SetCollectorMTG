import React from 'react';
import './CardModal.css';

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
  type?: string; // For backward compatibility with your existing code
  color?: string; // For displaying color information
}

interface CardModalProps {
  card: Card | null;
  onClose: () => void;
}

const CardModal: React.FC<CardModalProps> = ({ card, onClose }) => {
  if (!card) return null;

  // Helper function to render card details with consistent styling
  const renderCardDetail = (label: string, value: string | number | undefined) => {
    if (value === undefined || value === null || value === '') return null;
    return (
      <div className="card-detail-row">
        <span className="card-detail-label">{label}:</span>
        <span className="card-detail-value">{value}</span>
      </div>
    );
  };

  // Helper to format oracle text with proper line breaks and symbols
  const formatOracleText = (text?: string) => {
    if (!text) return null;
    
    // Split by line breaks and map each line to a paragraph
    return text.split('\n').map((line, index) => (
      <p key={index} className="oracle-text-paragraph">{line}</p>
    ));
  };

  // Handle card type display (use cardType if available, otherwise fallback to type)
  const displayType = card.cardType || card.type;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>&times;</button>
       
        <header className="modal-header">
          <h2 className="card-title">{card.name}</h2>
          {card.manaCost && (
            <div className="card-mana-cost" dangerouslySetInnerHTML={{ __html: formatManaCost(card.manaCost) }} />
          )}
        </header>
        
        <div className="card-modal-layout">
          <div className="card-modal-image">
            {card.imageUrl ? (
              <img
                src={card.imageUrl}
                alt={card.name}
                className="modal-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-card.jpg'; // Fallback image path
                  target.classList.add('image-error');
                }}
              />
            ) : (
              <div className="image-placeholder">
                <span>{card.name}</span>
              </div>
            )}
          </div>
         
          <div className="card-modal-details">
            <div className="card-details-section">
              <h3 className="section-title">Card Information</h3>
              <div className="card-details-grid">
                {renderCardDetail('Type', displayType)}
                {renderCardDetail('Rarity', capitalizeFirstLetter(card.rarity))}
                {renderCardDetail('Set', card.set)}
                {renderCardDetail('Color', card.color)}
                {renderCardDetail('Mana Value', card.manaValue)}
              </div>
            </div>
            
            {card.oracleText && (
              <div className="card-details-section">
                <h3 className="section-title">Card Text</h3>
                <div className="card-oracle-text">
                  {formatOracleText(card.oracleText)}
                </div>
              </div>
            )}

            {card.scryfallId && (
              <div className="card-details-section">
                <h3 className="section-title">External Links</h3>
                <div className="card-links">
                  <a 
                    href={`https://scryfall.com/card/${card.scryfallId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="external-link scryfall-link"
                  >
                    View on Scryfall
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to capitalize the first letter of a string
const capitalizeFirstLetter = (str?: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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