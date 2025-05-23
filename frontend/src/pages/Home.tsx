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

// Interfaz para datos de carta recibidos del backend
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
  const [hasMoreCards, setHasMoreCards] = useState(true);
  const [allCards, setAllCards] = useState<CardResponse[]>([]);
  const [currentSearchParams, setCurrentSearchParams] = useState<SearchParams | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Verificar estado de autenticación
  useEffect(() => {
    const isAuth = authService.isAuthenticated();
    console.log('Home - Authentication status:', isAuth);
    setIsAuthenticated(isAuth);
  }, []);

  // Formatear cartas para mostrar en el componente CardGrid
  const formatCardsForDisplay = (cardsData: CardResponse[]): Card[] => {
    return cardsData.map(card => ({
      id: card.cardId.toString(),
      name: card.name,
      imageUrl: card.imageUrl || `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.cardId}&type=card`,
      type: card.cardType || '',
      rarity: card.rarity || '',
      set: card.setId?.toString() || '',
      color: determineCardColor(card.manaCost || ''),
      manaCost: card.manaCost
    }));
  };

  const fetchCards = async (searchParams: SearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await apiService.searchCards(searchParams);
      
      // Almacenar todos los resultados de búsqueda para paginación
      setAllCards(results);
      
      // Solo mostrar la primera página (PAGE_SIZE cartas)
      const firstPageCards = results.slice(0, PAGE_SIZE);
      
      // Convertir al formato esperado por CardGrid
      const formattedCards = formatCardsForDisplay(firstPageCards);
      
      // Reiniciar paginación
      setCurrentPage(0);
      setCards(formattedCards);
      setHasMoreCards(results.length > PAGE_SIZE);
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching cards:', error);
      setError('Failed to search cards. Please try again.');
      setHasSearched(true);
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
    
    // Calculamos los índices para la siguiente página
    const startIndex = nextPage * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const nextPageItems = allCards.slice(startIndex, endIndex);
    
    if (nextPageItems.length === 0) {
      setHasMoreCards(false);
      setLoading(false);
      return;
    }
    
    // Transformar los datos
    const newCards = formatCardsForDisplay(nextPageItems);
    
    // Actualizar estado
    setCards((prev: any) => [...prev, ...newCards]);
    setCurrentPage(nextPage);
    setHasMoreCards(endIndex < allCards.length);
    setLoading(false);
  };

  // Función auxiliar para determinar el color principal de la carta basado en su costo de maná
  const determineCardColor = (manaCost: string): string => {
    if (!manaCost) return 'colorless';
    
    // Mapear símbolos de maná a nombres de color para la UI
    const colorMap: Record<string, string> = {
      'W': 'white',
      'U': 'blue',
      'B': 'black',
      'R': 'red',
      'G': 'green'
    };
    
    const foundColors: string[] = [];
    
    // Buscar símbolos de color en el costo de maná
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
        
        {hasSearched && (
          <CardGrid 
            cards={cards} 
            loading={loading} 
            hasMore={hasMoreCards}
            onLoadMore={handleLoadMore}
            isAuthenticated={isAuthenticated}
          />
        )}
      </main>
    </div>
  );
};

export default Home; 