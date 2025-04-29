import { useState, FormEvent, useEffect } from 'react';
import axios from 'axios';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (searchParams: SearchParams) => void;
}

export interface SearchParams {
  name: string;
  color: string;
  type: string;
  rarity: string;
  set: string;
  manaCost: string;
}

// URL base del backend
const API_BASE_URL = 'http://localhost:8080';

// Interfaz para los sets recibidos del backend
interface SetResponse {
  setId: number;
  setCode: string;
  name: string;
}

interface FilterOptions {
  colors: {id: string, name: string}[];
  types: string[];
  rarities: string[];
  sets: {
    id: string;
    code: string;
    name: string;
  }[];
  manaCosts: string[];
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    name: '',
    color: '',
    type: '',
    rarity: '',
    set: '',
    manaCost: ''
  });

  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    colors: [
      { id: 'W', name: 'white' },
      { id: 'U', name: 'blue' },
      { id: 'B', name: 'black' },
      { id: 'R', name: 'red' },
      { id: 'G', name: 'green' },
      { id: 'C', name: 'colorless' }
    ],
    types: ['Creature', 'Sorcery', 'Instant', 'Artifact', 'Enchantment', 'Planeswalker', 'Land'],
    rarities: ['common', 'uncommon', 'rare', 'mythic'],
    sets: [],
    manaCosts: ['0', '1', '2', '3', '4', '5', '6', '7', '8+']
  });

  const [loading, setLoading] = useState(false);

  // Cargar los datos de filtros al montar el componente
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setLoading(true);
      try {
        // Cargar la lista de sets
        const setsResponse = await axios.get<SetResponse[]>(`${API_BASE_URL}/sets`);
        
        // Actualizar las opciones de filtro
        setFilterOptions(prev => ({
          ...prev,
          sets: setsResponse.data.map((set: SetResponse) => ({
            id: set.setId.toString(),
            code: set.setCode,
            name: set.name
          }))
        }));
      } catch (error) {
        console.error('Error loading filter options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  // Actualizar el parámetro de color cuando cambian los colores seleccionados
  useEffect(() => {
    // El backend espera los símbolos de color (W, U, B, R, G, C) separados por comas
    // Para el caso de 'C' (incoloro), se debe enviar solo ese valor, no combinado con otros
    const colorValue = selectedColors.length > 0 ? selectedColors.join(',') : '';
    setSearchParams(prev => ({
      ...prev,
      color: colorValue
    }));
  }, [selectedColors]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar la selección de colores
  const handleColorToggle = (colorId: string) => {
    setSelectedColors(prev => {
      // Si ya está seleccionado, quitarlo
      if (prev.includes(colorId)) {
        return prev.filter(c => c !== colorId);
      } 
      
      // Si seleccionamos "colorless" (C), desactivamos cualquier otro color
      if (colorId === 'C') {
        return ['C'];
      }
      
      // Si ya hay algún color seleccionado y uno de ellos es "colorless", eliminamos "colorless"
      const newColors = prev.filter(c => c !== 'C');
      
      // Añadimos el nuevo color
      return [...newColors, colorId];
    });
  };

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setSelectedColors([]);
    setSearchParams({
      name: '',
      color: '',
      type: '',
      rarity: '',
      set: '',
      manaCost: ''
    });
  };

  // Obtener la clase CSS para el símbolo de mana según el color
  const getManaSymbolClass = (colorId: string) => {
    switch (colorId) {
      case 'W': return 'ms ms-w';
      case 'U': return 'ms ms-u';
      case 'B': return 'ms ms-b';
      case 'R': return 'ms ms-r';
      case 'G': return 'ms ms-g';
      case 'C': return 'ms ms-c';
      default: return '';
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(searchParams);
  };

  return (
    <div className={`search-container ${isExpanded ? 'expanded' : ''}`}>
      <form onSubmit={handleSubmit}>
        <div className="search-input-group">
          <input
            type="text"
            name="name"
            value={searchParams.name}
            onChange={handleInputChange}
            placeholder="Search for a card..."
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </div>

        <div className="filters-container">
          <div className="filter-group color-filter-group">
            <div className="filter-header">
              <label>Colors</label>
              {selectedColors.length > 0 && (
                <button type="button" className="clear-filter" onClick={() => setSelectedColors([])}>
                  Clear
                </button>
              )}
            </div>
            <div className="color-checkboxes">
              {filterOptions.colors.map(color => (
                <label 
                  key={color.id} 
                  className={`color-check-label ${selectedColors.includes(color.id) ? 'selected' : ''}`}
                  title={color.name.charAt(0).toUpperCase() + color.name.slice(1)}
                >
                  <input
                    type="checkbox"
                    checked={selectedColors.includes(color.id)}
                    onChange={() => handleColorToggle(color.id)}
                    className="color-checkbox"
                  />
                  <span className={`${getManaSymbolClass(color.id)} color-icon`}></span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={searchParams.type}
              onChange={handleInputChange}
            >
              <option value="">Any</option>
              {filterOptions.types.map(type => (
                <option key={type} value={type.toLowerCase()}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="rarity">Rarity</label>
            <select
              id="rarity"
              name="rarity"
              value={searchParams.rarity}
              onChange={handleInputChange}
            >
              <option value="">Any</option>
              {filterOptions.rarities.map(rarity => (
                <option key={rarity} value={rarity.toLowerCase()} className={`rarity-${rarity.toLowerCase()}`}>
                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="set">Set</label>
            <select
              id="set"
              name="set"
              value={searchParams.set}
              onChange={handleInputChange}
              disabled={loading || filterOptions.sets.length === 0}
            >
              <option value="">Any</option>
              {filterOptions.sets.map(set => (
                <option key={set.id} value={set.code}>
                  {set.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="manaCost">Mana Cost</label>
            <select
              id="manaCost"
              name="manaCost"
              value={searchParams.manaCost}
              onChange={handleInputChange}
            >
              <option value="">Any</option>
              {filterOptions.manaCosts.map(cost => (
                <option key={cost} value={cost}>
                  {cost}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-actions">
            <button type="button" className="clear-all-btn" onClick={handleClearFilters}>
              Clear All Filters
            </button>
          </div>
        </div>

        <div className="toggle-filters">
          <button 
            type="button" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="toggle-button"
          >
            {isExpanded ? 'Hide Filters' : 'Show Filters'} <span className={`arrow ${isExpanded ? 'up' : 'down'}`}>▼</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar; 