import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService, authService, collectionService } from '../services';
import { Deck, DeckCreateDto } from '../services/types';
import Header from '../components/Header';
import CardGrid from '../components/CardGrid';
import { Card } from '../components/CardGrid';
import SearchBar from '../components/SearchBar';
import { SearchParams } from '../components/SearchBar';
import DeckList from '../components/DeckList';
import './Collection.css';

const Collection = () => {
  const [collectionCards, setCollectionCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]); // Inicializado como array vacío
  const [decksLoading, setDecksLoading] = useState(true);
  const [decksError, setDecksError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cards' | 'decks'>('cards');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDeckLoading, setCreateDeckLoading] = useState(false);
  const [createDeckError, setCreateDeckError] = useState<string | null>(null);
  const [newDeck, setNewDeck] = useState<DeckCreateDto>({
    deckName: '',
    gameType: 'STANDARD',
    deckColor: ''
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar si se debe activar la pestaña de decks
  useEffect(() => {
    if (location.state && location.state.activeTab === 'decks') {
      setActiveTab('decks');
    }
  }, [location]);

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

  // Cargar decks del usuario
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchUserDecks = async () => {
      setDecksLoading(true);
      setDecksError(null);
      
      if (isAuthenticated) {
        try {
          const userId = authService.getUserIdentifier();
          console.log("Fetching decks for user:", userId);
          const userDecks = await apiService.getUserDecks();
          console.log("Received user decks:", userDecks);
          setDecks(Array.isArray(userDecks) ? userDecks : []);
        } catch (error) {
          console.error("Error fetching user decks:", error);
          setDecksError('Failed to load decks. Please try again.');
          setDecks([]);
        }
      } else {
        console.warn("User not authenticated, cannot fetch decks");
        setDecks([]);
      }
      
      setDecksLoading(false);
    };
    
    fetchUserDecks();
  }, [isAuthenticated]);
  
  // Función para abrir el modal de creación de mazos
  const openCreateModal = () => {
    console.log("Collection: Intentando abrir modal de creación de mazo");
    setActiveTab('decks');
    setShowCreateModal(true);
    setCreateDeckError(null);
    setNewDeck({
      deckName: '',
      gameType: 'STANDARD',
      deckColor: ''
    });
    console.log("Collection: Estado showCreateModal establecido a true");
  };

  // Función para cerrar el modal
  const closeModal = () => {
    console.log("Collection: Cerrando modal de creación");
    setShowCreateModal(false);
  };

  // Manejador para cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDeck(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para crear un nuevo mazo
  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Collection: Formulario de creación de mazo enviado");
    setCreateDeckLoading(true);
    setCreateDeckError(null);

    try {
      // Validación de campos obligatorios
      if (!newDeck.deckName?.trim()) {
        console.warn("Collection: Error de validación: Nombre de mazo vacío");
        setCreateDeckError('Deck name is required');
        setCreateDeckLoading(false);
        return;
      }

      console.log("Collection: Validación de formulario completada correctamente");
      
      // Obtener ID de usuario
      const userId = authService.getUserIdentifier();
      console.log("Collection: ID de usuario autenticado:", userId);
      
      if (!userId) {
        console.error("Collection: Error: No se pudo obtener el ID de usuario");
        throw new Error('Could not determine user ID');
      }
      
      // Asegurarnos que gameType sea un valor válido
      if (newDeck.gameType !== 'STANDARD' && newDeck.gameType !== 'COMMANDER') {
        console.warn(`Collection: Tipo de mazo no reconocido: ${newDeck.gameType}, usando STANDARD por defecto`);
        newDeck.gameType = 'STANDARD';
      }
      
      console.log("Collection: Enviando petición al API:", newDeck);

      const createdDeck = await apiService.createDeck({
        ...newDeck
      });
      
      console.log("Collection: Mazo creado con éxito:", createdDeck);
      
      // Cerrar modal y resetear formulario
      setShowCreateModal(false);
      setNewDeck({
        deckName: '',
        gameType: 'STANDARD',
        deckColor: ''
      });
      
      // Actualizar la lista de mazos
      handleDeckCreated();
    } catch (error: any) {
      console.error("Collection: Error al crear mazo:", error);
      setCreateDeckError(error.message || 'Error creating deck');
    } finally {
      setCreateDeckLoading(false);
    }
  };

  // Función para actualizar la lista de decks después de crear uno nuevo
  const handleDeckCreated = async () => {
    console.log("Collection: Ejecutando handleDeckCreated");
    try {
      const userDecks = await apiService.getUserDecks();
      console.log("Collection: Mazos obtenidos:", userDecks);
      // Asegurarse de que decks siempre sea un array
      setDecks(Array.isArray(userDecks) ? userDecks : []);
      // Cerrar el modal después de crear con éxito
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error refreshing decks:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCollectionCards = async () => {
      setLoading(true);
      setError(null);
      
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

        // Transformación de datos: Enfoque simplificado para evitar problemas de tipo
        let validCards: Card[] = [];
        
        for (const item of collectionData) {
          try {
            console.log('Processing item:', item);
            
            // Las cartas vienen en formato plano, sin objeto card anidado
            // La estructura es { collectionId, cardId, cardName, cardImageUrl, cardType, manaCost, rarity, ncopies }
            
            // Usar la URL de imagen proporcionada por el servidor directamente si es de Scryfall
            let imageUrl = item.cardImageUrl; // Usamos cardImageUrl en lugar de imageUrl
            
            // Verificar si la URL es de Scryfall - si lo es, mantenerla tal cual
            const isScryfallUrl = imageUrl && imageUrl.includes('api.scryfall.com/cards/');
            
            // Si no hay URL o es inválida, usar URL de respaldo basada en cardId
            if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined') {
              imageUrl = `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${item.cardId}&type=card`;
              console.log(`Usando URL de respaldo Gatherer para ${item.cardName}: ${imageUrl}`);
            } else if (isScryfallUrl) {
              console.log(`Usando URL de Scryfall original para ${item.cardName}: ${imageUrl}`);
            }
            
            // Formato adaptado para CardGrid
            const cardData: Card = {
              id: item.cardId.toString(),
              name: item.cardName || 'Unknown Card',
              imageUrl: imageUrl,
              type: item.cardType || 'Unknown',
              rarity: item.rarity || 'common',
              set: item.setCode || '',
              color: determineCardColor(item.manaCost || ''),
              manaValue: calculateManaValue(item.manaCost || ''),
              manaCost: item.manaCost || '',
              collectionCount: item.ncopies || 1
            };
            
            // Verificar que la URL es válida para visualización
            try {
              if (imageUrl) new URL(imageUrl);
            } catch (e) {
              console.error(`URL inválida para carta ${cardData.name}: ${cardData.imageUrl}`);
              cardData.imageUrl = `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${item.cardId}&type=card`;
            }
            
            validCards.push(cardData);
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

  // Función para calcular el valor de maná a partir del coste
  function calculateManaValue(manaCost: string): number {
    if (!manaCost) return 0;
    
    let value = 0;
    
    // Contar símbolos de color ({W}, {U}, etc.) como 1
    const colorSymbols = manaCost.match(/\{[WUBRGC]\}/g) || [];
    value += colorSymbols.length;
    
    // Sumar valores numéricos ({1}, {2}, etc.)
    const numericSymbols = manaCost.match(/\{(\d+)\}/g) || [];
    for (const symbol of numericSymbols) {
      const number = parseInt(symbol.replace(/[{}]/g, ''), 10);
      if (!isNaN(number)) value += number;
    }
    
    return value;
  }

  // Función para actualizar la cantidad de una carta en la colección
  const handleCardCollectionUpdated = useCallback((cardId: number, newCount: number) => {
    console.log(`Actualizando carta ${cardId} a ${newCount} en la UI`);
    
    setCollectionCards(prevCards => 
      prevCards.map(card => {
        if (card.id === cardId.toString()) {
          console.log(`Carta encontrada: ${card.name}, actualizando contador de ${card.collectionCount} a ${newCount}`);
          return {
            ...card,
            collectionCount: newCount
          };
        }
        return card;
      })
    );
    
    // También actualizar las cartas filtradas si es necesario
    setFilteredCards(prevFiltered => 
      prevFiltered.map(card => {
        if (card.id === cardId.toString()) {
          return {
            ...card,
            collectionCount: newCount
          };
        }
        return card;
      })
    );
  }, []);

  return (
    <div className="collection-container">
      <Header />
      <main className="container collection-main">
        <div className="collection-header">
          <h1 className="collection-title">My Collection</h1>
          <p className="collection-description">
            View and manage all the cards and decks in your personal collection.
          </p>
        </div>
        
        {/* Tabs para cambiar entre cartas y mazos */}
        <div className="collection-tabs">
          <button 
            className={`tab-button ${activeTab === 'cards' ? 'active' : ''}`}
            onClick={() => setActiveTab('cards')}
          >
            My Cards
          </button>
          <button 
            className={`tab-button ${activeTab === 'decks' ? 'active' : ''}`}
            onClick={() => setActiveTab('decks')}
          >
            My Decks
          </button>
          
          {/* Botón Create Deck solo visible cuando estamos en la pestaña decks */}
          {activeTab === 'decks' && (
            <button 
              className="create-deck-button" 
              onClick={() => {
                console.log("Collection: Botón 'Create Deck' en tabs clickeado");
                openCreateModal();
              }}
              style={{ 
                padding: '0.5rem 0.8rem',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: '#e65100',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                marginLeft: 'auto',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                alignSelf: 'flex-end',
                marginBottom: '2px'
              }}
            >
              Create +
            </button>
          )}
        </div>

        {activeTab === 'cards' && (
          <>
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
                onCardCollectionUpdated={handleCardCollectionUpdated}
              />
            )}
          </>
        )}
        
        {activeTab === 'decks' && (
          <>
            {decksError && (
              <div className="error-message">
                <p><strong>Error:</strong> {decksError}</p>
                <button 
                  className="retry-button"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            )}
            
            {decksLoading ? (
              <div className="collection-loading">
                <div className="spinner"></div>
                <p>Loading your decks...</p>
              </div>
            ) : (
              <>
                {Array.isArray(decks) && decks.length > 0 ? (
                  <DeckList 
                    decks={decks} 
                    onDeckCreated={handleDeckCreated}
                    onDeckDeleted={handleDeckCreated}
                    showCreateModal={showCreateModal}
                    setShowCreateModal={setShowCreateModal}
                  />
                ) : (
                  <div className="empty-collection">
                    <p>You don't have any decks yet. Create your first deck to start building!</p>
                    <button 
                      className="browse-cards-btn"
                      onClick={() => {
                        console.log("Collection: Botón 'Create Deck' clickeado");
                        openCreateModal();
                      }}
                    >
                      Create Deck
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
      
      {/* Modal para crear nuevo deck */}
      {showCreateModal && (
        <div 
          className="modal-overlay" 
          onClick={(e) => {
            e.stopPropagation();
            closeModal();
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#494949',
              borderRadius: '8px',
              padding: '2rem',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              color: '#ffffff',
              zIndex: 10000,
              position: 'relative'
            }}
          >
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Create New Deck</h2>
            
            {createDeckError && (
              <div 
                className="error-message"
                style={{
                  backgroundColor: 'rgba(220, 53, 69, 0.1)',
                  border: '1px solid rgba(220, 53, 69, 0.3)',
                  color: '#dc3545',
                  padding: '0.8rem',
                  borderRadius: '4px',
                  marginBottom: '1.5rem'
                }}
              >
                {createDeckError}
              </div>
            )}
            
            <form id="create-deck-form" onSubmit={handleCreateDeck}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label 
                  htmlFor="deckName"
                  style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  Deck Name
                </label>
                <input
                  type="text"
                  id="deckName"
                  name="deckName"
                  value={newDeck.deckName}
                  onChange={handleInputChange}
                  placeholder="Enter deck name"
                  disabled={createDeckLoading}
                  minLength={3}
                  maxLength={50}
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    backgroundColor: '#ffffff',
                    color: '#333'
                  }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label 
                  htmlFor="gameType"
                  style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  Game Type
                </label>
                <select
                  id="gameType"
                  name="gameType"
                  value={newDeck.gameType}
                  onChange={handleInputChange}
                  disabled={createDeckLoading}
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    backgroundColor: '#ffffff',
                    color: '#333'
                  }}
                >
                  <option value="STANDARD">Standard</option>
                  <option value="COMMANDER">Commander</option>
                </select>
              </div>
              
              <div 
                className="form-actions"
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                  marginTop: '2rem'
                }}
              >
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Collection: Botón Cancelar clickeado");
                    closeModal();
                  }}
                  disabled={createDeckLoading}
                  style={{
                    padding: '0.8rem 1.5rem',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    border: '1px solid #ddd',
                    color: '#ddd'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="create-button"
                  disabled={createDeckLoading}
                  style={{
                    padding: '0.8rem 1.5rem',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    backgroundColor: '#e65100',
                    color: 'white',
                    border: 'none',
                    minWidth: '120px'
                  }}
                >
                  {createDeckLoading ? 'Creating...' : 'Create Deck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collection;
