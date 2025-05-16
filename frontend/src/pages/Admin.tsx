import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import authService from '../services/authService';
import { apiService } from '../services';
import './Admin.css';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('users');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para cada sección
  const [users, setUsers] = useState<any[]>([]);
  const [sets, setSets] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [decks, setDecks] = useState<any[]>([]);
  
  // Estados para formularios
  const [showUserForm, setShowUserForm] = useState<boolean>(false);
  const [showSetForm, setShowSetForm] = useState<boolean>(false);
  const [showCardForm, setShowCardForm] = useState<boolean>(false);
  
  // Estados para elementos seleccionados
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedSet, setSelectedSet] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<any>(null);

  useEffect(() => {
    // Verificar si el usuario es administrador
    if (!authService.isAdmin()) {
      navigate('/');
      return;
    }
    
    // Cargar datos iniciales según la pestaña activa
    loadTabData(activeTab);
  }, [activeTab, navigate]);

  const loadTabData = async (tab: string) => {
    setLoading(true);
    setError(null);
    
    try {
      switch (tab) {
        case 'users':
          const fetchedUsers = await apiService.getAllUsers();
          setUsers(fetchedUsers);
          break;
        case 'sets':
          const fetchedSets = await apiService.getAllSets();
          setSets(fetchedSets);
          break;
        case 'cards':
          // Aquí podríamos implementar una búsqueda paginada, 
          // ya que obtener todas las cartas podría ser demasiado
          const fetchedCards = await apiService.getAllCards();
          setCards(fetchedCards);
          break;
        case 'decks':
          const fetchedDecks = await apiService.getAllDecks();
          setDecks(fetchedDecks);
          break;
        default:
          break;
      }
    } catch (err: any) {
      console.error(`Error loading ${tab} data:`, err);
      setError(`Error cargando datos: ${err.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para usuarios
  const handleCreateUser = async (userData: any) => {
    try {
      await apiService.createUser(userData);
      setShowUserForm(false);
      loadTabData('users');
    } catch (err: any) {
      setError(`Error creando usuario: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await apiService.deleteUser(userId);
        loadTabData('users');
      } catch (err: any) {
        setError(`Error eliminando usuario: ${err.message}`);
      }
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setShowUserForm(true);
  };

  const handleUpdateUser = async (userData: any) => {
    try {
      await apiService.updateUser(userData.id, userData);
      setShowUserForm(false);
      setSelectedUser(null);
      loadTabData('users');
    } catch (err: any) {
      setError(`Error actualizando usuario: ${err.message}`);
    }
  };

  // Funciones para sets
  const handleCreateSet = async (setData: any) => {
    try {
      await apiService.createSet(setData);
      setShowSetForm(false);
      loadTabData('sets');
    } catch (err: any) {
      setError(`Error creando set: ${err.message}`);
    }
  };

  const handleDeleteSet = async (setId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este set?')) {
      try {
        await apiService.deleteSet(setId);
        loadTabData('sets');
      } catch (err: any) {
        setError(`Error eliminando set: ${err.message}`);
      }
    }
  };

  const handleEditSet = (set: any) => {
    setSelectedSet(set);
    setShowSetForm(true);
  };

  const handleUpdateSet = async (setData: any) => {
    try {
      await apiService.updateSet(setData.id, setData);
      setShowSetForm(false);
      setSelectedSet(null);
      loadTabData('sets');
    } catch (err: any) {
      setError(`Error actualizando set: ${err.message}`);
    }
  };

  // Funciones para cartas
  const handleCreateCard = async (cardData: any) => {
    try {
      await apiService.createCard(cardData);
      setShowCardForm(false);
      loadTabData('cards');
    } catch (err: any) {
      setError(`Error creando carta: ${err.message}`);
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta carta?')) {
      try {
        await apiService.deleteCard(cardId);
        loadTabData('cards');
      } catch (err: any) {
        setError(`Error eliminando carta: ${err.message}`);
      }
    }
  };

  const handleEditCard = (card: any) => {
    setSelectedCard(card);
    setShowCardForm(true);
  };

  const handleUpdateCard = async (cardData: any) => {
    try {
      await apiService.updateCard(cardData.id, cardData);
      setShowCardForm(false);
      setSelectedCard(null);
      loadTabData('cards');
    } catch (err: any) {
      setError(`Error actualizando carta: ${err.message}`);
    }
  };

  // Funciones para mazos (más simples, probablemente solo ver y eliminar)
  const handleDeleteDeck = async (deckId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este mazo?')) {
      try {
        await apiService.deleteDeck(deckId);
        loadTabData('decks');
      } catch (err: any) {
        setError(`Error eliminando mazo: ${err.message}`);
      }
    }
  };

  const renderUserForm = () => (
    <div className="admin-form">
      <h3>{selectedUser ? 'Editar Usuario' : 'Crear Usuario'}</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const userData = {
          id: selectedUser?.id,
          username: formData.get('username') as string,
          email: formData.get('email') as string,
          // Puedes añadir más campos según sea necesario
        };
        
        if (selectedUser) {
          handleUpdateUser(userData);
        } else {
          handleCreateUser(userData);
        }
      }}>
        <div className="form-group">
          <label htmlFor="username">Nombre de usuario</label>
          <input 
            type="text" 
            id="username" 
            name="username" 
            defaultValue={selectedUser?.username || ''} 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            defaultValue={selectedUser?.email || ''} 
            required 
          />
        </div>
        {!selectedUser && (
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              required 
            />
          </div>
        )}
        <div className="form-buttons">
          <button type="submit" className="btn-primary">
            {selectedUser ? 'Actualizar' : 'Crear'}
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => {
              setShowUserForm(false);
              setSelectedUser(null);
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );

  const renderSetForm = () => (
    <div className="admin-form">
      <h3>{selectedSet ? 'Editar Set' : 'Crear Set'}</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const setData = {
          id: selectedSet?.id,
          name: formData.get('name') as string,
          code: formData.get('code') as string,
          releaseDate: formData.get('releaseDate') as string,
          // Añadir más campos según sea necesario
        };
        
        if (selectedSet) {
          handleUpdateSet(setData);
        } else {
          handleCreateSet(setData);
        }
      }}>
        <div className="form-group">
          <label htmlFor="name">Nombre del Set</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            defaultValue={selectedSet?.name || ''} 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="code">Código</label>
          <input 
            type="text" 
            id="code" 
            name="code" 
            defaultValue={selectedSet?.code || ''} 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="releaseDate">Fecha de lanzamiento</label>
          <input 
            type="date" 
            id="releaseDate" 
            name="releaseDate" 
            defaultValue={selectedSet?.releaseDate || ''} 
            required 
          />
        </div>
        <div className="form-buttons">
          <button type="submit" className="btn-primary">
            {selectedSet ? 'Actualizar' : 'Crear'}
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => {
              setShowSetForm(false);
              setSelectedSet(null);
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );

  const renderCardForm = () => (
    <div className="admin-form">
      <h3>{selectedCard ? 'Editar Carta' : 'Crear Carta'}</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const cardData = {
          id: selectedCard?.id,
          name: formData.get('name') as string,
          cardType: formData.get('cardType') as string,
          manaCost: formData.get('manaCost') as string,
          rarity: formData.get('rarity') as string,
          setId: parseInt(formData.get('setId') as string),
          oracleText: formData.get('oracleText') as string,
          cardImageUrl: formData.get('cardImageUrl') as string,
          // Más campos según sea necesario
        };
        
        if (selectedCard) {
          handleUpdateCard(cardData);
        } else {
          handleCreateCard(cardData);
        }
      }}>
        <div className="form-group">
          <label htmlFor="name">Nombre de la Carta</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            defaultValue={selectedCard?.name || ''} 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="cardType">Tipo</label>
          <input 
            type="text" 
            id="cardType" 
            name="cardType" 
            defaultValue={selectedCard?.cardType || ''} 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="manaCost">Coste de Maná</label>
          <input 
            type="text" 
            id="manaCost" 
            name="manaCost" 
            defaultValue={selectedCard?.manaCost || ''} 
          />
        </div>
        <div className="form-group">
          <label htmlFor="rarity">Rareza</label>
          <select 
            id="rarity" 
            name="rarity" 
            defaultValue={selectedCard?.rarity || 'common'} 
            required
          >
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
            <option value="mythic">Mythic Rare</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="setId">Set</label>
          <select 
            id="setId" 
            name="setId" 
            defaultValue={selectedCard?.setId || ''} 
            required
          >
            <option value="">Seleccionar Set</option>
            {sets.map(set => (
              <option key={set.id} value={set.id}>{set.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="oracleText">Texto</label>
          <textarea 
            id="oracleText" 
            name="oracleText" 
            defaultValue={selectedCard?.oracleText || ''} 
            rows={4}
          />
        </div>
        <div className="form-group">
          <label htmlFor="cardImageUrl">URL de la Imagen</label>
          <input 
            type="url" 
            id="cardImageUrl" 
            name="cardImageUrl" 
            defaultValue={selectedCard?.cardImageUrl || ''} 
          />
        </div>
        <div className="form-buttons">
          <button type="submit" className="btn-primary">
            {selectedCard ? 'Actualizar' : 'Crear'}
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => {
              setShowCardForm(false);
              setSelectedCard(null);
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );

  const renderUsersTab = () => (
    <div className="admin-tab-content">
      <div className="admin-actions">
        <button className="btn-primary" onClick={() => setShowUserForm(true)}>
          Crear Usuario
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Cargando usuarios...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td className="actions">
                  <button onClick={() => handleEditUser(user)}>Editar</button>
                  <button 
                    className="delete" 
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {showUserForm && renderUserForm()}
    </div>
  );

  const renderSetsTab = () => (
    <div className="admin-tab-content">
      <div className="admin-actions">
        <button className="btn-primary" onClick={() => setShowSetForm(true)}>
          Crear Set
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Cargando sets...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Código</th>
              <th>Fecha de Lanzamiento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sets.map(set => (
              <tr key={set.id}>
                <td>{set.id}</td>
                <td>{set.name}</td>
                <td>{set.code}</td>
                <td>{new Date(set.releaseDate).toLocaleDateString()}</td>
                <td className="actions">
                  <button onClick={() => handleEditSet(set)}>Editar</button>
                  <button 
                    className="delete" 
                    onClick={() => handleDeleteSet(set.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {showSetForm && renderSetForm()}
    </div>
  );

  const renderCardsTab = () => (
    <div className="admin-tab-content">
      <div className="admin-actions">
        <button className="btn-primary" onClick={() => setShowCardForm(true)}>
          Crear Carta
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Cargando cartas...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Rareza</th>
              <th>Set</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cards.map(card => (
              <tr key={card.id || card.cardId}>
                <td>{card.id || card.cardId}</td>
                <td>{card.name}</td>
                <td>{card.cardType}</td>
                <td>{card.rarity}</td>
                <td>{card.setName || card.setCode}</td>
                <td className="actions">
                  <button onClick={() => handleEditCard(card)}>Editar</button>
                  <button 
                    className="delete" 
                    onClick={() => handleDeleteCard(card.id || card.cardId)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {showCardForm && renderCardForm()}
    </div>
  );

  const renderDecksTab = () => (
    <div className="admin-tab-content">
      {loading ? (
        <div className="loading">Cargando mazos...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Tipo</th>
              <th>Color</th>
              <th>Cartas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {decks.map(deck => (
              <tr key={deck.deckId}>
                <td>{deck.deckId}</td>
                <td>{deck.deckName}</td>
                <td>{deck.userId}</td>
                <td>{deck.gameType}</td>
                <td>{deck.deckColor}</td>
                <td>{deck.totalCards}</td>
                <td className="actions">
                  <button 
                    className="delete" 
                    onClick={() => handleDeleteDeck(deck.deckId)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="admin-page">
      <Header />
      <div className="admin-container">
        <h1>Panel de Administración</h1>
        
        <div className="admin-tabs">
          <button 
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Usuarios
          </button>
          <button 
            className={`tab-button ${activeTab === 'sets' ? 'active' : ''}`}
            onClick={() => setActiveTab('sets')}
          >
            Sets
          </button>
          <button 
            className={`tab-button ${activeTab === 'cards' ? 'active' : ''}`}
            onClick={() => setActiveTab('cards')}
          >
            Cartas
          </button>
          <button 
            className={`tab-button ${activeTab === 'decks' ? 'active' : ''}`}
            onClick={() => setActiveTab('decks')}
          >
            Mazos
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'sets' && renderSetsTab()}
          {activeTab === 'cards' && renderCardsTab()}
          {activeTab === 'decks' && renderDecksTab()}
        </div>
      </div>
    </div>
  );
};

export default Admin; 