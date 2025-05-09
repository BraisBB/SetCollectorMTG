import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CardGrid from '../components/CardGrid';
import { Card } from '../components/CardGrid';
import collectionService from '../services/collectionService';
import authService from '../services/authService';
import './Collection.css';

const Collection = () => {
  const [collectionCards, setCollectionCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null); // Para depuración
  const navigate = useNavigate();

  // Función para eliminar una carta de la vista cuando es eliminada de la colección
  const handleCardRemoved = useCallback((cardId: number) => {
    console.log(`Removing card ${cardId} from collection view`);
    // Filtrar la carta eliminada de la lista de cartas
    setCollectionCards(prevCards => prevCards.filter(card => parseInt(card.id, 10) !== cardId));
  }, []);

  // Check authentication status
  useEffect(() => {
    const isAuth = authService.isAuthenticated();
    console.log('Collection - Authentication status:', isAuth);
    console.log('Access token:', authService.getToken() ? 'Present' : 'Not found');
    console.log('Access token from localStorage:', localStorage.getItem('access_token') ? 'Present' : 'Not found');
    
    if (!isAuth) {
      console.log('User is not authenticated, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }
    
    setIsAuthenticated(true);
    console.log('User is authenticated, proceeding to load collection');
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCollectionCards = async () => {
      setLoading(true);
      setError(null);
      setDebugInfo(null);
      
      try {
        console.log('Fetching collection cards...');
        
        // Fetch user collection cards using our service
        const collectionData = await collectionService.getUserCollectionCards();
        console.log('Received collection data:', collectionData);
        
        if (!collectionData || !Array.isArray(collectionData) || collectionData.length === 0) {
          console.log('No collection cards found or empty array returned');
          setCollectionCards([]);
          setLoading(false);
          return;
        }
        
        setDebugInfo(`Found ${collectionData.length} cards in collection`);
        
        // Transformación de datos: Enfoque simplificado para evitar problemas de tipo
        let validCards: Card[] = [];
        
        for (const item of collectionData) {
          try {
            console.log('Processing item:', item);
            
            let cardData: Card | null = null;
            
            // Verificar si los datos vienen en formato anidado o plano
            if (item.card) {
              // Formato anidado
              cardData = {
                id: item.card.cardId?.toString() || '0',
                name: item.card.name || 'Unknown',
                imageUrl: item.card.imageUrl || 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=0&type=card',
                type: item.card.cardType || 'Unknown',
                rarity: item.card.rarity || 'common',
                set: (item.card.setId?.toString() || '0'),
                color: determineCardColor(item.card.manaCost || ''),
                collectionCount: item.nCopies || 1
              };
            } else {
              // Formato plano (cardName, cardImageUrl, etc.)
              cardData = {
                id: item.cardId?.toString() || '0',
                name: item.cardName || `Card ${item.cardId}`,
                imageUrl: item.cardImageUrl || 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=0&type=card',
                type: item.cardType || 'Unknown',
                rarity: item.rarity || 'common',
                set: item.collectionId?.toString() || '0',
                color: determineCardColor(item.manaCost || ''),
                collectionCount: item.ncopies || 1
              };
            }
            
            if (cardData) {
              validCards.push(cardData);
            }
          } catch (error) {
            console.error('Error transforming card data:', error, item);
          }
        }

        console.log('Transformed cards:', validCards);
        setCollectionCards(validCards);
      } catch (err: any) {
        console.error('Error fetching collection cards:', err);
        setError(`Error loading your collection: ${err.message || 'Unknown error'}`);
        setDebugInfo(err.stack);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionCards();
  }, [isAuthenticated]);

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

  // Determinar si estamos en modo desarrollo
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="collection-container">
      <Header />
      <main className="container collection-main">
        <div className="collection-header">
          <h1 className="collection-title">My Collection</h1>
          <p className="collection-description">
            View and manage all the cards in your personal collection.
          </p>
        </div>

        {/* Debug info (visible solo en desarrollo) */}
        {isDevelopment && debugInfo && (
          <div className="debug-info">
            <pre>{debugInfo}</pre>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p><strong>Error:</strong> {error}</p>
            <button 
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {loading && collectionCards.length === 0 ? (
          <div className="collection-loading">
            <div className="spinner"></div>
            <p>Loading your collection...</p>
          </div>
        ) : collectionCards.length === 0 ? (
          <div className="empty-collection">
            <p>Your collection is empty. Start by adding cards from the home page.</p>
            <button 
              className="browse-cards-btn"
              onClick={() => navigate('/')}
            >
              Browse Cards
            </button>
          </div>
        ) : (
          <CardGrid 
            cards={collectionCards} 
            loading={loading}
            hasMore={false}
            onLoadMore={() => {}}
            isAuthenticated={isAuthenticated}
            isCollectionPage={true}
            onCardRemoved={handleCardRemoved}
          />
        )}
      </main>
    </div>
  );
};

export default Collection;
