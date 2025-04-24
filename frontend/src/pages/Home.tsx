import { useState, useEffect } from 'react';
import api, { SetMtg, Card } from '../services/api';
import SetItem from '../components/SetItem';
import CardItem from '../components/CardItem';

const Home = () => {
  const [sets, setSets] = useState<SetMtg[]>([]);
  const [selectedSet, setSelectedSet] = useState<SetMtg | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const data = await api.getAllSets();
        setSets(data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los sets');
        setLoading(false);
      }
    };

    fetchSets();
  }, []);

  const handleSetClick = async (set: SetMtg) => {
    try {
      setSelectedSet(set);
      const data = await api.getCardsBySet(set.setId);
      setCards(data);
    } catch (err) {
      setError('Error al cargar las cartas del set');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Magic: The Gathering</h1>
          <p className="text-gray-600 mt-2">Explora los sets y cartas de Magic: The Gathering</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Sets */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-6">Sets Disponibles</h2>
              <div className="space-y-4">
                {sets.map((set) => (
                  <SetItem
                    key={set.setId}
                    set={set}
                    isSelected={selectedSet?.setId === set.setId}
                    onClick={handleSetClick}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Lista de Cartas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-6">
                {selectedSet ? `Cartas de ${selectedSet.name}` : 'Selecciona un set'}
              </h2>
              {selectedSet ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cards.map((card) => (
                    <CardItem key={card.cardId} card={card} />
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  Selecciona un set para ver sus cartas
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 