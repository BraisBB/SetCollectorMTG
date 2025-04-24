import { Card } from '../services/api';

interface CardItemProps {
  card: Card;
}

const CardItem = ({ card }: CardItemProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-[745/1040] relative">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">Sin imagen</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{card.name}</h3>
        <div className="flex justify-between text-sm text-gray-600">
          <span>{card.cardType}</span>
          <span>{card.manaCost}</span>
        </div>
        <div className="mt-2 flex justify-between items-center">
          <span className="text-sm text-gray-500">{card.rarity}</span>
          <span className="text-sm font-medium">CMC: {card.manaValue}</span>
        </div>
      </div>
    </div>
  );
};

export default CardItem; 