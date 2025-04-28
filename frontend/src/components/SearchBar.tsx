import { useState, FormEvent, useEffect } from 'react';
import axios from 'axios';
import ColorSelect from './ColorSelect';
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
  colors: string[];
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

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    colors: ['white', 'blue', 'black', 'red', 'green', 'colorless'],
    types: ['Creature', 'Sorcery', 'Instant', 'Artifact', 'Enchantment', 'Planeswalker', 'Land'],
    rarities: ['Common', 'Uncommon', 'Rare', 'Mythic Rare'],
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
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
          <div className="filter-group">
            <label htmlFor="color">Color</label>
            <ColorSelect
              value={searchParams.color}
              onChange={(value) => setSearchParams(prev => ({ ...prev, color: value }))}
              options={filterOptions.colors}
            />
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
                <option key={rarity} value={rarity.toLowerCase()}>
                  {rarity}
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
        </div>

        <div className="toggle-filters">
          <button 
            type="button" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="toggle-button"
          >
            {isExpanded ? 'Hide Filters' : 'Show Filters'} ▼
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar; 