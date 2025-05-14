import { useState, useEffect } from 'react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import CardGrid from '../components/CardGrid';
import { SearchParams } from '../components/SearchBar';
import { Card } from '../components/CardGrid';
import './Home.css';
import axios from 'axios';
import authService from '../services/authService';

// URL base del backend
const API_BASE_URL = 'http://localhost:8080';

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
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreCards, setHasMoreCards] = useState(false);
  const [allCards, setAllCards] = useState<CardResponse[]>([]);
  const [currentSearchParams, setCurrentSearchParams] = useState<SearchParams | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check authentication status
  useEffect(() => {
    const isAuth = authService.isAuthenticated();
    console.log('Home - Authentication status:', isAuth);
    setIsAuthenticated(isAuth);
  }, []);

  const fetchCards = async (searchParams: SearchParams, page: number = 0) => {
    setLoading(true);
    
    try {
      // Construir los parámetros de consulta para la búsqueda
      const params = new URLSearchParams();
      
      if (searchParams.name) {
        params.append('name', searchParams.name);
      }
      
      if (searchParams.color) {
        // El color ya viene formateado correctamente desde el componente SearchBar
        params.append('color', searchParams.color);
      }
      
      if (searchParams.type) {
        params.append('type', searchParams.type);
      }
      
      if (searchParams.rarity) {
        params.append('rarity', searchParams.rarity);
      }
      
      if (searchParams.set) {
        params.append('setCode', searchParams.set);
      }
      
      if (searchParams.manaCost) {
        if (searchParams.manaCost === '8+') {
          params.append('manaCostMin', '8');
        } else {
          params.append('manaCostMin', searchParams.manaCost);
          params.append('manaCostMax', searchParams.manaCost);
        }
      }
      
      // Hacer la llamada al backend
      const response = await axios.get<CardResponse[]>(`${API_BASE_URL}/cards`, { params });
      setAllCards(response.data);
      
      // Dividir los resultados para la paginación
      const totalResults = response.data.length;
      const pagedResults = response.data.slice(0, PAGE_SIZE);
      
      // Determinar si hay más cartas para cargar
      setHasMoreCards(totalResults > PAGE_SIZE);
      
      // Transformar los datos recibidos al formato esperado por CardGrid
      const cards: Card[] = pagedResults.map((card: CardResponse) => {
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
      
      setSearchResults(cards);
      setCurrentPage(0);
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError('Error fetching cards. Please try again.');
      setSearchResults([]);
      setHasMoreCards(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchParams: SearchParams) => {
    setHasSearched(true);
    setError(null);
    setCurrentSearchParams(searchParams);
    await fetchCards(searchParams);
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
      setSearchResults(prev => [...prev, ...newCards]);
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
        {!hasSearched && (
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
            cards={searchResults} 
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