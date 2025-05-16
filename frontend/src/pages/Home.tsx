import { useState, useEffect } from 'react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import CardGrid from '../components/CardGrid';
import { SearchParams } from '../components/SearchBar';
import { Card } from '../components/CardGrid';
import './Home.css';
import { apiService } from '../services';
import authService from '../services/authService';

// Tamaño de página para cargar cartas
const PAGE_SIZE = 20;

// Interfaz para los datos de la carta recibidos del backend
interface CardResponse {
  cardId: number;
  name: string;
  imageUrl?: string;
  cardType: string;
  rarity: string;
  setId: number;
  manaCost?: string;
}

const Home = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreCards, setHasMoreCards] = useState(false);
  const [allCards, _setAllCards] = useState<CardResponse[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentSearchParams, setCurrentSearchParams] = useState<SearchParams | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check authentication status
  useEffect(() => {
    const isAuth = authService.isAuthenticated();
    console.log('Home - Authentication status:', isAuth);
    setIsAuthenticated(isAuth);
  }, []);

  const fetchCards = async (searchParams: SearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await apiService.searchCards(searchParams);
      
      // Convertir al formato esperado por CardGrid
      const formattedCards: Card[] = results.map(card => ({
        id: card.cardId.toString(),
        name: card.name,
        imageUrl: card.imageUrl || `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.cardId}&type=card`,
        type: card.cardType || '',
        rarity: card.rarity || '',
        set: card.setId?.toString() || '',
        color: determineCardColor(card.manaCost || ''),
        manaCost: card.manaCost
      }));
      
      setCards(formattedCards);
    } catch (error) {
      console.error('Error searching cards:', error);
      setError('Failed to search cards. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (searchParams: SearchParams) => {
    setCurrentSearchParams(searchParams);
    fetchCards(searchParams);
  };

  const handleLoadMore = () => {
    if (!hasMoreCards || loading || !allCards.length) return;
    
    setLoading(true);
    const nextPage = currentPage + 1;
    
    setTimeout(() => {
      const startIndex = nextPage * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const nextPageItems = allCards.slice(startIndex, endIndex);
      
      // Transformar los datos
      const newCards: Card[] = nextPageItems.map((card: CardResponse) => {
        // Validar y asegurar que tenemos una URL de imagen válida
        let imageUrl = card.imageUrl;
        
        // Si no hay URL o es inválida, usar URL de respaldo de Gatherer
        if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined') {
          imageUrl = `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.cardId}&type=card`;
          console.log(`Usando URL de respaldo para ${card.name}: ${imageUrl}`);
        }
        
        // Verificar que la URL es válida
        try {
          new URL(imageUrl);
        } catch (e) {
          console.error(`URL inválida para carta ${card.name}: ${imageUrl}`);
          imageUrl = `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.cardId}&type=card`;
        }
        
        return {
          id: card.cardId.toString(),
          name: card.name,
          imageUrl: imageUrl,
          type: card.cardType,
          rarity: card.rarity,
          set: card.setId.toString(),
          color: determineCardColor(card.manaCost || ''),
          manaCost: card.manaCost
        };
      });
      
      // Actualizar el estado
      setCards(prev => [...prev, ...newCards]);
      setCurrentPage(nextPage);
      setHasMoreCards((nextPage + 1) * PAGE_SIZE < allCards.length);
      setLoading(false);
    }, 500); // Pequeño retraso para mejor experiencia visual
  };

  // Función auxiliar para determinar el color principal de la carta basado en su coste de maná
  const determineCardColor = (manaCost: string): string => {
    if (!manaCost) return 'colorless';
    
    // Mapeamos los símbolos de mana a nombres de colores para la UI
    const colorMap: Record<string, string> = {
      'W': 'white',
      'U': 'blue',
      'B': 'black',
      'R': 'red',
      'G': 'green'
    };
    
    const foundColors: string[] = [];
    
    // Buscar símbolos de color en el coste de maná
    for (const [symbol, colorName] of Object.entries(colorMap)) {
      if (manaCost.includes(`{${symbol}}`)) {
        foundColors.push(colorName);
      }
    }
    
    if (foundColors.length === 0) return 'colorless';
    if (foundColors.length > 1) return 'multicolor';
    return foundColors[0];
  };

  return (
    <div className="home-container">
      <Header />
      <main className="container home-main">
        {!currentSearchParams && (
          <div className="hero-section">
            <h1 className="home-title">Welcome to SetCollectorMTG</h1>
            <p className="home-description">
              Your ultimate platform for collecting and managing Magic: The Gathering sets.
              Search for cards below to start your collection journey.
            </p>
          </div>
        )}
        
        <SearchBar onSearch={handleSearch} />
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <CardGrid 
          cards={cards} 
          loading={loading} 
          hasMore={hasMoreCards}
          onLoadMore={handleLoadMore}
          isAuthenticated={isAuthenticated}
        />
      </main>
    </div>
  );
};

export default Home; 