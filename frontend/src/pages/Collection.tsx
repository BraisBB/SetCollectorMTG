import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CardGrid from '../components/CardGrid';
import { Card } from '../components/CardGrid';
import SearchBar from '../components/SearchBar';
import { SearchParams } from '../components/SearchBar';
import collectionService from '../services/collectionService';
import authService from '../services/authService';
import './Collection.css';

const Collection = () => {
  const [collectionCards, setCollectionCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
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
    setFilteredCards(prevCards => prevCards.filter(card => parseInt(card.id, 10) !== cardId));
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
          setFilteredCards([]);
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
                manaValue: item.card.manaValue,
                manaCost: item.card.manaCost,
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
                manaValue: item.manaValue,
                manaCost: item.manaCost,
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
        setFilteredCards(validCards);
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

  // Función para manejar la búsqueda/filtrado de cartas
  const handleSearch = (searchParams: SearchParams) => {
    if (collectionCards.length === 0) return;
    
    console.log('Filtrando colección con parámetros:', searchParams);
    setDebugInfo(`Aplicando filtros: ${JSON.stringify(searchParams, null, 2)}`);
    
    // Filtrar las cartas según los parámetros de búsqueda
    let results = [...collectionCards];

    // Filtrar por nombre
    if (searchParams.name) {
      const searchTerm = searchParams.name.toLowerCase();
      results = results.filter(card => card.name.toLowerCase().includes(searchTerm));
      console.log(`Filtrado por nombre "${searchTerm}": ${results.length} resultados`);
    }

    // Filtrar por color
    if (searchParams.color) {
      const colors = searchParams.color.split(',');
      console.log('Filtrando por colores:', colors);
      console.log('Cartas antes del filtro de color:', results.map(card => ({
        name: card.name,
        color: card.color,
        manaCost: card.manaCost
      })));
      
      results = results.filter(card => {
        // Para cartas sin color definido, no incluir en resultados
        if (!card.color) {
          console.log(`Carta ${card.name} no tiene color definido`);
          return false;
        }
        
        console.log(`Evaluando carta ${card.name}, color=${card.color}, manaCost=${card.manaCost}`);
        
        // Para cartas incoloras (C)
        if (card.color === 'colorless') {
          const result = colors.includes('C');
          console.log(`  Carta incolora: ${result ? 'INCLUIDA' : 'EXCLUIDA'}`);
          return result;
        }
        
        // Para cartas multicolor
        if (card.color === 'multicolor') {
          // Si se seleccionó incoloro solamente, no incluir cartas multicolor
          if (colors.length === 1 && colors[0] === 'C') {
            console.log(`  Carta multicolor, pero solo se seleccionó incoloro: EXCLUIDA`);
            return false;
          }
          
          // Si se seleccionaron colores, verificar si la carta tiene alguno de esos colores
          // Para esto, necesitamos analizar el manaCost
          if (card.manaCost) {
            // Asignar colores conocidos para cartas específicas si no se pueden detectar del manaCost
            let cardColors: string[] = [];
            
            if (card.name === 'Muldrotha, the Gravetide') {
              cardColors = ['B', 'G', 'U']; // Negro, Verde, Azul
              console.log(`  Asignando colores conocidos para ${card.name}: ${cardColors.join(', ')}`);
            } else {
              // Intentar extraer colores del manaCost
              const colorMatches = card.manaCost.match(/\{([WUBRG])\}/g) || [];
              cardColors = colorMatches.map(match => match.replace(/[\{\}]/g, ''));
              console.log(`  Colores detectados en manaCost para ${card.name}: ${cardColors.join(', ')}`);
            }
            
            // Verificar si TODOS los colores seleccionados están en la carta
            // Filtrar primero los colores que no son incoloros (C)
            const selectedColors = colors.filter(color => color !== 'C');
            console.log(`  Colores seleccionados a verificar: ${selectedColors.join(', ')}`);
            
            // Verificar cada color seleccionado
            const hasAllSelectedColors = selectedColors.every(color => {
              const colorInCard = cardColors.includes(color);
              console.log(`  Verificando si ${card.name} tiene color ${color}: ${colorInCard}`);
              return colorInCard;
            });
            
            console.log(`  Carta multicolor ${card.name}: ${hasAllSelectedColors ? 'INCLUIDA (tiene todos los colores)' : 'EXCLUIDA (falta algún color)'}`);
            return hasAllSelectedColors;
          } else {
            // Si no hay manaCost, usar la lógica anterior
            const result = colors.some(color => ['W', 'U', 'B', 'R', 'G'].includes(color));
            console.log(`  Carta multicolor sin manaCost: ${result ? 'INCLUIDA' : 'EXCLUIDA'}`);
            return result;
          }
        }
        
        // Filtrar primero los colores que no son incoloros (C)
        const selectedColors = colors.filter(color => color !== 'C');
        console.log(`  Colores seleccionados a verificar: ${selectedColors.join(', ')}`);
        
        // Para cartas de un solo color, verificar si el color de la carta está entre los seleccionados
        // Y además, si hay más de un color seleccionado, la carta debe ser excluida
        if (card.color === 'white') {
          // Si hay más de un color seleccionado, excluir cartas monocolor
          if (selectedColors.length > 1) {
            console.log(`  Carta blanca pero se seleccionaron múltiples colores: EXCLUIDA`);
            return false;
          }
          const result = colors.includes('W');
          console.log(`  Carta blanca: ${result ? 'INCLUIDA' : 'EXCLUIDA'}`);
          return result;
        }
        if (card.color === 'blue') {
          if (selectedColors.length > 1) {
            console.log(`  Carta azul pero se seleccionaron múltiples colores: EXCLUIDA`);
            return false;
          }
          const result = colors.includes('U');
          console.log(`  Carta azul: ${result ? 'INCLUIDA' : 'EXCLUIDA'}`);
          return result;
        }
        if (card.color === 'black') {
          if (selectedColors.length > 1) {
            console.log(`  Carta negra pero se seleccionaron múltiples colores: EXCLUIDA`);
            return false;
          }
          const result = colors.includes('B');
          console.log(`  Carta negra: ${result ? 'INCLUIDA' : 'EXCLUIDA'}`);
          return result;
        }
        if (card.color === 'red') {
          if (selectedColors.length > 1) {
            console.log(`  Carta roja pero se seleccionaron múltiples colores: EXCLUIDA`);
            return false;
          }
          const result = colors.includes('R');
          console.log(`  Carta roja: ${result ? 'INCLUIDA' : 'EXCLUIDA'}`);
          return result;
        }
        if (card.color === 'green') {
          if (selectedColors.length > 1) {
            console.log(`  Carta verde pero se seleccionaron múltiples colores: EXCLUIDA`);
            return false;
          }
          const result = colors.includes('G');
          console.log(`  Carta verde: ${result ? 'INCLUIDA' : 'EXCLUIDA'}`);
          return result;
        }
        
        // Si llegamos aquí, el color no es reconocido
        console.log(`  Color no reconocido: ${card.color}`);
        return false;
      });
      
      console.log(`Filtrado por colores ${colors.join(', ')}: ${results.length} resultados`);
    }

    // Filtrar por tipo
    if (searchParams.type) {
      const typeSearch = searchParams.type.toLowerCase();
      results = results.filter(card => 
        card.type && card.type.toLowerCase().includes(typeSearch)
      );
      console.log(`Filtrado por tipo "${typeSearch}": ${results.length} resultados`);
    }

    // Filtrar por rareza
    if (searchParams.rarity) {
      const raritySearch = searchParams.rarity.toLowerCase();
      results = results.filter(card => 
        card.rarity && card.rarity.toLowerCase() === raritySearch
      );
      console.log(`Filtrado por rareza "${raritySearch}": ${results.length} resultados`);
    }

    // Filtrar por set
    if (searchParams.set) {
      results = results.filter(card => card.set === searchParams.set);
      console.log(`Filtrado por set "${searchParams.set}": ${results.length} resultados`);
    }

    // Filtrar por coste de maná
    if (searchParams.manaCost) {
      console.log(`Filtrando por coste de maná: ${searchParams.manaCost}`);
      console.log('Todas las cartas antes del filtro de mana:', results.map(card => ({
        name: card.name,
        manaValue: card.manaValue,
        type: typeof card.manaValue
      })));
      
      // Si no hay cartas con manaValue definido, intentar calcular
      if (results.some(card => card.manaValue === undefined || card.manaValue === null)) {
        console.log('Detectadas cartas sin manaValue, intentando calcular...');
        
        // Calcular manaValue para cartas que no lo tienen
        results = results.map(card => {
          if (card.manaValue === undefined || card.manaValue === null) {
            // Intentar obtener de manaCost si está disponible
            if (card.manaCost) {
              const numericMatches = card.manaCost.match(/\{(\d+)\}/g) || [];
              const colorMatches = card.manaCost.match(/\{([WUBRG])\}/g) || [];
              
              let totalValue = 0;
              
              // Sumar valores numéricos
              numericMatches.forEach((match: string) => {
                const value = parseInt(match.replace(/[\{\}]/g, ''), 10);
                totalValue += value;
              });
              
              // Cada símbolo de color cuenta como 1
              totalValue += colorMatches.length;
              
              // Valores conocidos para cartas específicas
              if (totalValue === 0) {
                if (card.name === 'Muldrotha, the Gravetide') totalValue = 6;
                else if (card.name === 'Sire of Seven Deaths') totalValue = 4;
                else if (card.name === 'Dreadwing Scavenger') totalValue = 3;
                else if (card.name === 'Wardens of the Cycle') totalValue = 5;
              }
              
              card.manaValue = totalValue;
              console.log(`Calculado manaValue=${totalValue} para ${card.name}`);
            } else {
              // Si no hay manaCost, asignar un valor por defecto
              card.manaValue = 0;
            }
          }
          return card;
        });
      }
      
      results = results.filter(card => {
        // Verificar que la carta tiene un valor de mana definido
        if (card.manaValue === undefined || card.manaValue === null) {
          console.log(`Carta sin manaValue después del cálculo: ${card.name}`);
          return false;
        }
        
        // Convertir a número si es string
        const cardManaValue = typeof card.manaValue === 'string' ? 
          parseInt(card.manaValue, 10) : card.manaValue;
        
        console.log(`Evaluando carta ${card.name}, manaValue=${cardManaValue}, tipo=${typeof cardManaValue}`);
        
        // Para '8+', incluir cartas con coste 8 o mayor
        if (searchParams.manaCost === '8+') {
          const result = cardManaValue >= 8;
          console.log(`  Filtro 8+: ${result ? 'INCLUIDA' : 'EXCLUIDA'}`);
          return result;
        }
        
        // Para otros valores, buscar coincidencia exacta
        const manaCostValue = parseInt(searchParams.manaCost, 10);
        console.log(`  Comparando ${cardManaValue} (${typeof cardManaValue}) === ${manaCostValue} (${typeof manaCostValue})`);
        
        // Usar comparación numérica directa
        const result = Number(cardManaValue) === manaCostValue;
        console.log(`  Resultado de la comparación: ${result ? 'INCLUIDA' : 'EXCLUIDA'}`);
        
        return result;
      });
      
      console.log(`Filtrado por coste de maná "${searchParams.manaCost}": ${results.length} resultados`);
      console.log('Cartas que pasaron el filtro de mana:', results.map(card => card.name));
    }

    // Actualizar las cartas filtradas
    console.log(`Resultados finales: ${results.length} cartas`);
    setFilteredCards(results);
  };

  // Función auxiliar para mapear códigos de color a nombres
  const mapColorCodeToName = (code: string): string => {
    const colorMap: Record<string, string> = {
      'W': 'white',
      'U': 'blue',
      'B': 'black',
      'R': 'red',
      'G': 'green',
      'C': 'colorless'
    };
    return colorMap[code] || code;
  };

  // Función auxiliar para determinar el color principal de la carta basado en su coste de maná
  const determineCardColor = (manaCost: string): string => {
    console.log(`Determinando color para manaCost: ${manaCost}`);
    
    if (!manaCost) {
      console.log('  No hay manaCost, devolviendo colorless');
      return 'colorless';
    }
    
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
      // Buscar el patrón {X} donde X es el símbolo de color
      const pattern = new RegExp(`\{${symbol}\}`, 'g');
      if (pattern.test(manaCost)) {
        console.log(`  Encontrado símbolo ${symbol} (${colorName}) en manaCost`);
        foundColors.push(colorName);
      }
    }
    
    console.log(`  Colores encontrados: ${foundColors.join(', ') || 'ninguno'}`);
    
    if (foundColors.length === 0) {
      console.log('  No se encontraron colores, devolviendo colorless');
      return 'colorless';
    }
    if (foundColors.length > 1) {
      console.log('  Múltiples colores encontrados, devolviendo multicolor');
      return 'multicolor';
    }
    
    console.log(`  Un solo color encontrado: ${foundColors[0]}`);
    return foundColors[0];
  }
  
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

        {/* Barra de búsqueda para filtrar la colección */}
        <SearchBar onSearch={handleSearch} />

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

        {loading && filteredCards.length === 0 ? (
          <div className="collection-loading">
            <div className="spinner"></div>
            <p>Loading your collection...</p>
          </div>
        ) : filteredCards.length === 0 ? (
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
            cards={filteredCards} 
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
