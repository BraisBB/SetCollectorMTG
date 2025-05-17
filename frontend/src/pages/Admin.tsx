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
    console.log("Verificando permisos de administrador...");
    const isAdmin = authService.isAdmin();
    console.log("¿Es administrador?", isAdmin);
    
    if (!isAdmin) {
      console.warn("Usuario sin permisos de administrador, redirigiendo a inicio");
      navigate('/');
      return;
    }
    
    console.log("Usuario autenticado como administrador, cargando panel");
    // Cargar datos iniciales según la pestaña activa
    loadTabData(activeTab);
  }, [activeTab, navigate]);

  const loadTabData = async (tab: string) => {
    setLoading(true);
    setError(null);
    
    try {
      switch (tab) {
        case 'users':
          console.log('Solicitando usuarios...');
          const fetchedUsers = await apiService.getAllUsers();
          console.log('Usuarios recibidos:', fetchedUsers);
          
          if (!fetchedUsers || !Array.isArray(fetchedUsers)) {
            console.error('Datos de usuarios recibidos no válidos:', fetchedUsers);
            setUsers([]);
            setError('Error: Los datos de usuarios recibidos no son válidos');
          } else {
            console.log(`Recibidos ${fetchedUsers.length} usuarios correctamente`);
            setUsers(fetchedUsers);
          }
          break;
        case 'sets':
          const fetchedSets = await apiService.getAllSets();
          setSets(fetchedSets);
          break;
        case 'cards':
          // Here we could implement paginated search,
          // as getting all cards could be too much
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
      setError(`Error loading data: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // User functions
  const handleCreateUser = async (userData: any) => {
    try {
      console.log('Creating user with data:', userData);
      // Create a properly formatted UserCreateDto object as expected by the backend
      const userCreateDto = {
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: userData.password
      };
      await apiService.createUser(userCreateDto);
      setShowUserForm(false);
      loadTabData('users');
    } catch (err: any) {
      setDetailedError('Error creating user', err);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!userId) {
      setError("Cannot delete user: Missing user ID");
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        console.log(`Deleting user with ID: ${userId}`);
        await apiService.deleteUser(userId);
        console.log(`User ${userId} deleted successfully`);
        loadTabData('users');
      } catch (err: any) {
        setDetailedError(`Error deleting user ${userId}`, err);
      }
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setShowUserForm(true);
  };

  const handleUpdateUser = async (userData: any) => {
    try {
      console.log('Updating user with data:', userData);
      
      // Determine the correct user ID (could be in id or userId field)
      const userId = userData.userId || userData.id;
      if (!userId) {
        throw new Error("Cannot update user: Missing user ID");
      }
      
      // Create a properly formatted UserDto object as expected by the backend
      const userDto = {
        userId: userId,
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName
      };
      
      console.log(`Calling updateUser with userId: ${userId} and data:`, userDto);
      await apiService.updateUser(userId, userDto);
      setShowUserForm(false);
      setSelectedUser(null);
      loadTabData('users');
    } catch (err: any) {
      setDetailedError('Error updating user', err);
    }
  };

  // Sets functions
  const handleCreateSet = async (setData: any) => {
    try {
      await apiService.createSet(setData);
      setShowSetForm(false);
      loadTabData('sets');
    } catch (err: any) {
      setError(`Error creating set: ${err.message}`);
    }
  };

  const handleDeleteSet = async (setId: number) => {
    if (window.confirm('Are you sure you want to delete this set?')) {
      try {
        await apiService.deleteSet(setId);
        loadTabData('sets');
      } catch (err: any) {
        setError(`Error deleting set: ${err.message}`);
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
      setError(`Error updating set: ${err.message}`);
    }
  };

  // Cards functions
  const handleCreateCard = async (cardData: any) => {
    try {
      await apiService.createCard(cardData);
      setShowCardForm(false);
      loadTabData('cards');
    } catch (err: any) {
      setError(`Error creating card: ${err.message}`);
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        await apiService.deleteCard(cardId);
        loadTabData('cards');
      } catch (err: any) {
        setError(`Error deleting card: ${err.message}`);
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
      setError(`Error updating card: ${err.message}`);
    }
  };

  // Decks functions (simpler, probably just view and delete)
  const handleDeleteDeck = async (deckId: number) => {
    if (window.confirm('Are you sure you want to delete this deck?')) {
      try {
        await apiService.deleteDeck(deckId);
        loadTabData('decks');
      } catch (err: any) {
        setError(`Error deleting deck: ${err.message}`);
      }
    }
  };

  // Función para mostrar errores detallados
  const setDetailedError = (message: string, err: any) => {
    console.error(message, err);
    
    // Construir un mensaje de error detallado
    let errorDetail = err.message || 'Unknown error';
    
    // Si hay detalles adicionales disponibles en la respuesta
    if (err.response && err.response.data) {
      if (typeof err.response.data === 'string') {
        errorDetail += ': ' + err.response.data;
      } else if (err.response.data.message) {
        errorDetail += ': ' + err.response.data.message;
      } else if (err.response.data.error) {
        errorDetail += ': ' + err.response.data.error;
      } else if (err.response.data.errors) {
        // Para errores de validación múltiples
        const validationErrors = Object.entries(err.response.data.errors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('; ');
        errorDetail += ': ' + validationErrors;
      }
    }
    
    setError(`${message}: ${errorDetail}`);
  };

  const testConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Testing connection to the server...");
      
      // Intentar obtener la lista de usuarios como prueba
      const users = await apiService.getAllUsers();
      console.log("Connection test successful:", users);
      
      setError(null);
      alert("Conexión exitosa con el servidor. Se recibieron " + users.length + " usuarios.");
    } catch (err: any) {
      setDetailedError("Error testing connection", err);
    } finally {
      setLoading(false);
    }
  };

  const renderUserForm = () => (
    <div className="admin-form">
      <h3>{selectedUser ? 'Edit User' : 'Create User'}</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const userData = {
          id: selectedUser?.id || selectedUser?.userId,
          userId: selectedUser?.userId || selectedUser?.id,
          username: formData.get('username') as string,
          email: formData.get('email') as string,
          firstName: formData.get('firstName') as string,
          lastName: formData.get('lastName') as string,
          // Optional password field for new users
          ...(selectedUser ? {} : { password: formData.get('password') as string })
        };
        
        if (selectedUser) {
          handleUpdateUser(userData);
        } else {
          handleCreateUser(userData);
        }
      }}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
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
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input 
            type="text" 
            id="firstName" 
            name="firstName" 
            defaultValue={selectedUser?.firstName || ''} 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input 
            type="text" 
            id="lastName" 
            name="lastName" 
            defaultValue={selectedUser?.lastName || ''} 
            required 
          />
        </div>
        {!selectedUser && (
          <div className="form-group">
            <label htmlFor="password">Password</label>
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
            {selectedUser ? 'Update' : 'Create'}
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => {
              setShowUserForm(false);
              setSelectedUser(null);
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const renderSetForm = () => (
    <div className="admin-form">
      <h3>{selectedSet ? 'Edit Set' : 'Create Set'}</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const setData = {
          id: selectedSet?.id,
          name: formData.get('name') as string,
          code: formData.get('code') as string,
          releaseDate: formData.get('releaseDate') as string,
          // Add more fields as needed
        };
        
        if (selectedSet) {
          handleUpdateSet(setData);
        } else {
          handleCreateSet(setData);
        }
      }}>
        <div className="form-group">
          <label htmlFor="name">Set Name</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            defaultValue={selectedSet?.name || ''} 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="code">Code</label>
          <input 
            type="text" 
            id="code" 
            name="code" 
            defaultValue={selectedSet?.code || ''} 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="releaseDate">Release Date</label>
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
            {selectedSet ? 'Update' : 'Create'}
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => {
              setShowSetForm(false);
              setSelectedSet(null);
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const renderCardForm = () => (
    <div className="admin-form">
      <h3>{selectedCard ? 'Edit Card' : 'Create Card'}</h3>
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
          // More fields as needed
        };
        
        if (selectedCard) {
          handleUpdateCard(cardData);
        } else {
          handleCreateCard(cardData);
        }
      }}>
        <div className="form-group">
          <label htmlFor="name">Card Name</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            defaultValue={selectedCard?.name || ''} 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="cardType">Type</label>
          <input 
            type="text" 
            id="cardType" 
            name="cardType" 
            defaultValue={selectedCard?.cardType || ''} 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="manaCost">Mana Cost</label>
          <input 
            type="text" 
            id="manaCost" 
            name="manaCost" 
            defaultValue={selectedCard?.manaCost || ''} 
          />
        </div>
        <div className="form-group">
          <label htmlFor="rarity">Rarity</label>
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
            <option value="">Select Set</option>
            {sets.map(set => (
              <option key={set.id} value={set.id}>{set.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="oracleText">Text</label>
          <textarea 
            id="oracleText" 
            name="oracleText" 
            defaultValue={selectedCard?.oracleText || ''} 
            rows={4}
          />
        </div>
        <div className="form-group">
          <label htmlFor="cardImageUrl">Image URL</label>
          <input 
            type="url" 
            id="cardImageUrl" 
            name="cardImageUrl" 
            defaultValue={selectedCard?.cardImageUrl || ''} 
          />
        </div>
        <div className="form-buttons">
          <button type="submit" className="btn-primary">
            {selectedCard ? 'Update' : 'Create'}
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => {
              setShowCardForm(false);
              setSelectedCard(null);
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const renderUsersTab = () => (
    <div className="admin-tab-content">
      <div className="admin-actions">
        <button className="btn-primary" onClick={() => setShowUserForm(true)}>
          Create User
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading users...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : !users || users.length === 0 ? (
        <div className="info">No users found.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              // Ensure we have a valid ID for this user
              const userId = user.id || user.userId;
              
              return (
                <tr key={userId || `user-${Math.random()}`}>
                  <td>{userId || 'N/A'}</td>
                  <td>{user.username || 'N/A'}</td>
                  <td>{user.email || 'N/A'}</td>
                  <td>{user.firstName || 'N/A'}</td>
                  <td>{user.lastName || 'N/A'}</td>
                  <td className="actions">
                    <button 
                      onClick={() => handleEditUser(user)}
                      disabled={!userId}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete" 
                      onClick={() => handleDeleteUser(userId)}
                      disabled={!userId}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
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
          Create Set
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading sets...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Code</th>
              <th>Release Date</th>
              <th>Actions</th>
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
                  <button onClick={() => handleEditSet(set)}>Edit</button>
                  <button 
                    className="delete" 
                    onClick={() => handleDeleteSet(set.id)}
                  >
                    Delete
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
          Create Card
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading cards...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Rarity</th>
              <th>Set</th>
              <th>Actions</th>
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
                  <button onClick={() => handleEditCard(card)}>Edit</button>
                  <button 
                    className="delete" 
                    onClick={() => handleDeleteCard(card.id || card.cardId)}
                  >
                    Delete
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
        <div className="loading">Loading decks...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>User</th>
              <th>Type</th>
              <th>Color</th>
              <th>Cards</th>
              <th>Actions</th>
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
                    Delete
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
        <h1>Admin Panel</h1>
        
        {error && (
          <div className="error">{error}</div>
        )}
        
        <div className="admin-actions" style={{ marginBottom: '20px' }}>
          <button 
            className="btn-secondary" 
            onClick={testConnection}
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Test Server Connection'}
          </button>
        </div>
        
        <div className="admin-tabs">
          <button 
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
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
            Cards
          </button>
          <button 
            className={`tab-button ${activeTab === 'decks' ? 'active' : ''}`}
            onClick={() => setActiveTab('decks')}
          >
            Decks
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