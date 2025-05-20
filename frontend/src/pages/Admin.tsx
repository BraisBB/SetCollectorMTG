import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import authService from '../services/authService';
import { apiService } from '../services';
import './Admin.css';
// Importar el CSS de Collection para reutilizar sus estilos
import './Collection.css';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('users');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // States for each section
  const [users, setUsers] = useState<any[]>([]);
  const [sets, setSets] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [decks, setDecks] = useState<any[]>([]);
  
  // States for forms
  const [showUserForm, setShowUserForm] = useState<boolean>(false);
  const [showSetForm, setShowSetForm] = useState<boolean>(false);
  const [showCardForm, setShowCardForm] = useState<boolean>(false);
  
  // States for selected items
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedSet, setSelectedSet] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  // Estado para importación de cartas
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Verify if user is administrator
    console.log("Verifying administrator permissions...");
    const isAdmin = authService.isAdmin();
    console.log("Is administrator?", isAdmin);
    
    if (!isAdmin) {
      console.warn("User without administrator permissions, redirecting to home");
      navigate('/');
      return;
    }
    
    console.log("User authenticated as administrator, loading panel");
    // Load initial data based on active tab
    loadTabData(activeTab);
  }, [activeTab, navigate]);

  const loadTabData = async (tab: string) => {
    setLoading(true);
    setError(null);
    
    try {
      switch (tab) {
        case 'users':
          console.log('Requesting users...');
          const fetchedUsers = await apiService.getAllUsers();
          console.log('Users received:', fetchedUsers);
          
          if (!fetchedUsers || !Array.isArray(fetchedUsers)) {
            console.error('Received invalid user data:', fetchedUsers);
            setUsers([]);
            setError('Error: Received invalid user data');
          } else {
            console.log(`Received ${fetchedUsers.length} users correctly`);
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
    // Asegurarnos de que tenemos un ID válido
    const setId = set.id || set.setId;
    if (!setId) {
      console.error("No se puede editar el set: Falta el ID");
      setError("No se puede editar el set: Falta el ID");
      return;
    }
    
    console.log("Editando set con ID:", setId, set);
    setSelectedSet({
      ...set,
      id: setId,
      setId: setId // Mantener compatibilidad
    });
    setShowSetForm(true);
  };

  const handleUpdateSet = async (setData: any) => {
    try {
      // Asegurarnos de que tenemos un ID válido
      const setId = setData.id || setData.setId;
      if (!setId) {
        throw new Error("No se puede actualizar el set: Falta el ID");
      }
      
      console.log(`Actualizando set con ID ${setId}:`, setData);
      await apiService.updateSet(setId, setData);
      setShowSetForm(false);
      setSelectedSet(null);
      loadTabData('sets');
    } catch (err: any) {
      setError(`Error actualizando set: ${err.message}`);
    }
  };

  // Cards functions
  const handleCreateCard = async (cardData: any) => {
    try {
      // Format data according to the DTO expected by the backend
      const cardCreateDto: {
        name: string;
        cardType: string;
        manaCost: string;
        rarity: string;
        manaValue: number;
        oracleText: string;
        imageUrl: string;
        setId?: number;
      } = {
        name: cardData.name,
        cardType: cardData.cardType,
        manaCost: cardData.manaCost || "",
        rarity: cardData.rarity,
        manaValue: cardData.manaValue || 0,
        oracleText: cardData.oracleText || "",
        imageUrl: cardData.imageUrl || "",
      };
      
      // Only include setId if present
      if (cardData.setId !== undefined) {
        cardCreateDto.setId = cardData.setId;
      }
      
      console.log("Sending data to create card:", cardCreateDto);
      await apiService.createCard(cardCreateDto);
      
      // Clear form state
      setShowCardForm(false);
      setSelectedCard(null);
      
      // Reload data
      loadTabData('cards');
    } catch (err: any) {
      setError(`Error creating card: ${err.message}`);
    }
  };

  // Function to load all sets
  const loadSets = async () => {
    try {
      const fetchedSets = await apiService.getAllSets();
      setSets(fetchedSets);
      console.log("Sets loaded successfully:", fetchedSets);
    } catch (err: any) {
      setError(`Error loading sets: ${err.message}`);
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

  // Function to prepare a card for editing
  const handleEditCard = (card: any) => {
    console.log("Preparing card for editing:", card);
    
    // Always load sets before editing a card
    console.log("Loading sets before editing...");
    loadSets().then(() => {
      prepareCardForEditing(card);
    });
  };
  
  // Helper function to prepare the card for editing
  const prepareCardForEditing = (card: any) => {
    // Determine the ID of the set from the setMtg directly
    let cardSetId = null;
    
    // Verify all data available in the console
    console.log("Complete card to edit:", JSON.stringify(card, null, 2));
    
    // Try to get setId specifically from the setMtg object (highest priority)
    if (card.setMtg && card.setMtg.setId) {
      cardSetId = card.setMtg.setId;
      console.log("Using setId from setMtg object:", cardSetId);
    } 
    // If no setMtg, search in other fields
    else if (card.setId !== undefined && card.setId !== null) {
      cardSetId = card.setId;
      console.log("Using direct setId:", cardSetId);
    } else if (card.set_id !== undefined && card.set_id !== null) {
      cardSetId = card.set_id;
      console.log("Using set_id from DB:", cardSetId);
    }
    
    // Log for diagnostic
    console.log("Available sets:", sets.map(s => ({ id: s.id, name: s.name })));
    console.log("Determined set ID:", cardSetId);
    
    // Verify if the set exists in our data
    const setExists = cardSetId ? sets.some(s => s.id === cardSetId) : false;
    if (cardSetId && !setExists) {
      console.warn(`The set with ID ${cardSetId} is not in the list of available sets`);
    }
    
    // Save original set for comparison during update
    const originalSetId = cardSetId;
    
    // Create a normalized object for editing
    const normalizedCard = {
      id: card.id || card.cardId,
      cardId: card.id || card.cardId,
      name: card.name || "",
      cardType: card.cardType || card.type || "",
      manaCost: card.manaCost || "",
      rarity: card.rarity || "common",
      manaValue: card.manaValue || 0,
      setId: cardSetId,
      set_id: cardSetId,
      originalSetId: originalSetId, // Save original ID for comparison
      oracleText: card.oracleText || "",
      cardImageUrl: card.imageUrl || card.cardImageUrl || "",
      imageUrl: card.imageUrl || card.cardImageUrl || "",
      isNewCard: false // This is an existing card being edited
    };
    
    console.log("Normalized data for editing:", normalizedCard);
    setSelectedCard(normalizedCard);
    setShowCardForm(true);
  };

  // Function to update an existing card
  const handleUpdateCard = async (cardData: any) => {
    try {
      const cardId = cardData.id || cardData.cardId;
      if (!cardId) {
        throw new Error("Cannot update card: Missing card ID");
      }
      
      console.log("Complete data for update:", cardData);
      
      // Create a complete DTO to ensure all fields are present
      // Using an extended interface to allow optional setId
      interface CardDto {
        id: number;
        name: string;
        cardType: string;
        manaCost: string;
        rarity: string;
        manaValue: number;
        oracleText: string;
        imageUrl: string;
        setId?: number; // Only allow number or undefined for the API
      }
      
      const cardDto: CardDto = {
        id: cardId, // Include id instead of cardId
        name: cardData.name,
        cardType: cardData.cardType,
        manaCost: cardData.manaCost || "",
        rarity: cardData.rarity,
        manaValue: cardData.manaValue || 0,
        oracleText: cardData.oracleText || "",
        imageUrl: cardData.imageUrl || cardData.cardImageUrl || "",
      };
      
      // Only include setId if changed from original value or if present
      const isSetIdChanged = cardData.setId !== cardData.originalSetId;
      if (cardData.setId) {
        const setId = typeof cardData.setId === 'string' ? parseInt(cardData.setId) : cardData.setId;
        if (!isNaN(setId)) {
          cardDto.setId = setId;
          console.log("Including setId in update:", setId);
          if (isSetIdChanged) {
            console.log(`SetId changed from ${cardData.originalSetId} to ${setId}`);
          } else {
            console.log("SetId did not change");
          }
        }
      } else {
        // If set was removed (was not null and now is null)
        // We don't add any setId to the DTO for the backend to treat as undefined
        if (cardData.originalSetId) {
          console.log(`Removing setId (was ${cardData.originalSetId})`);
          // Don't include setId in the DTO
        }
      }
      
      console.log("Sending update data to backend:", cardDto);
      await apiService.updateCard(cardId, cardDto);
      console.log("Card updated successfully");
      
      // Clear form state
      setShowCardForm(false);
      setSelectedCard(null);
      
      // Reload data
      loadTabData('cards');
    } catch (err: any) {
      console.error("Error updating card:", err);
      setError(`Error updating card: ${err.message || "Unknown error"}`);
    }
  };

  // Helper function to calculate mana value from mana cost
  const calculateManaValue = (manaCost: string): number => {
    // Remove braces and count symbols
    const cleanedCost = manaCost.replace(/[{}]/g, '');
    let total = 0;
    
    // Count numeric symbols
    const numericMatch = cleanedCost.match(/\d+/g);
    if (numericMatch) {
      total += numericMatch.reduce((sum, num) => sum + parseInt(num), 0);
    }
    
    // Count color symbols (W, U, B, R, G)
    const colorMatches = cleanedCost.match(/[WUBRG]/g);
    if (colorMatches) {
      total += colorMatches.length;
    }
    
    return total;
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

  // Import cards from JSON file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check if file is JSON
      if (!file.name.toLowerCase().endsWith('.json')) {
        setError('Only JSON files are allowed');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleImportCards = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setImportLoading(true);
    setError(null);
    setImportSuccess(false);
    
    try {
      const response = await apiService.importCardsFromFile(selectedFile);
      
      if (response.success) {
        setImportSuccess(true);
        setSelectedFile(null);
        // Reload cards data
        loadTabData('cards');
      } else {
        setError(response.message || 'Error importing cards');
      }
    } catch (err: any) {
      setDetailedError('Error importing cards', err);
    } finally {
      setImportLoading(false);
    }
  };

  // Función para mostrar errores detallados
  const setDetailedError = (message: string, err: any) => {
    console.error(message, err);
    
    // Build a detailed error message
    let errorDetail = err.message || 'Unknown error';
    
    // If additional details are available in the response
    if (err.response && err.response.data) {
      if (typeof err.response.data === 'string') {
        errorDetail += ': ' + err.response.data;
      } else if (err.response.data.message) {
        errorDetail += ': ' + err.response.data.message;
      } else if (err.response.data.error) {
        errorDetail += ': ' + err.response.data.error;
      } else if (err.response.data.errors) {
        // For multiple validation errors
        const validationErrors = Object.entries(err.response.data.errors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('; ');
        errorDetail += ': ' + validationErrors;
      }
    }
    
    setError(`${message}: ${errorDetail}`);
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
        
        // Obtener el ID del set (puede estar en id o setId)
        const setId = selectedSet?.id || selectedSet?.setId;
        console.log("ID del set seleccionado:", setId);
        
        const setData = {
          id: setId,
          setId: setId, // Mantener compatibilidad
          name: formData.get('name') as string,
          setCode: formData.get('setCode') as string,
          releaseDate: formData.get('releaseDate') as string,
          totalCards: selectedSet?.totalCards || 0
        };
        
        console.log("Datos del set para actualización:", setData);
        
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
          <label htmlFor="setCode">Set Code</label>
          <input 
            type="text" 
            id="setCode" 
            name="setCode" 
            defaultValue={selectedSet?.setCode || ''} 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="releaseDate">Release Date</label>
          <input 
            type="date" 
            id="releaseDate" 
            name="releaseDate" 
            defaultValue={selectedSet?.releaseDate ? new Date(selectedSet.releaseDate).toISOString().split('T')[0] : ''} 
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
      <h3>{selectedCard?.isNewCard ? 'Create Card' : 'Edit Card'}</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        // Get form values
        const name = formData.get('name') as string;
        const cardType = formData.get('cardType') as string;
        const manaCost = formData.get('manaCost') as string || "";
        const rarity = formData.get('rarity') as string;
        const setIdStr = formData.get('setId') as string;
        const oracleText = formData.get('oracleText') as string || "";
        const cardImageUrl = formData.get('cardImageUrl') as string || "";
        
        // Calculate mana value based on mana cost
        const manaValue = calculateManaValue(manaCost);
        
        // Process setId (now optional)
        let setId = undefined;
        if (setIdStr && setIdStr !== '') {
          setId = parseInt(setIdStr);
          console.log("Set selected from form:", setId);
        }
        
        // Prepare data object
        const cardData: {
          id?: number;
          cardId?: number;
          name: string;
          cardType: string;
          manaCost: string;
          manaValue: number;
          rarity: string;
          oracleText: string;
          imageUrl: string;
          cardImageUrl: string;
          setId?: number;
          originalSetId?: number;
        } = {
          ...(selectedCard && !selectedCard.isNewCard ? { id: selectedCard.id, cardId: selectedCard.id } : {}),
          name,
          cardType,
          manaCost,
          manaValue,
          rarity,
          oracleText,
          imageUrl: cardImageUrl,
          cardImageUrl
        };
        
        // Add setId only if present and save original if editing
        if (setId !== undefined) {
          cardData.setId = setId;
        }
        
        // If editing, save original setId for comparison
        if (selectedCard && !selectedCard.isNewCard) {
          cardData.originalSetId = selectedCard.originalSetId;
        }
        
        console.log("Processed form data:", cardData);
        
        // Call appropriate function
        if (selectedCard && !selectedCard.isNewCard) {
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
            placeholder="Example: {W}{U}{2} (W=white, U=blue, B=black, R=red, G=green)"
            onChange={(e) => {
              // Update mana value when mana cost changes
              if (selectedCard) {
                const newManaValue = calculateManaValue(e.target.value);
                setSelectedCard({
                  ...selectedCard,
                  manaCost: e.target.value,
                  manaValue: newManaValue
                });
              }
              
              // Update mana value field visually
              const manaValueField = document.getElementById('manaValue') as HTMLInputElement;
              if (manaValueField) {
                manaValueField.value = String(calculateManaValue(e.target.value));
              }
            }}
          />
          <small className="form-text text-muted">
            Use format {"{X}"} where X can be a number or color symbol: W (white), U (blue), B (black), R (red), G (green)
          </small>
        </div>
        <div className="form-group">
          <label htmlFor="manaValue">Mana Value (automatically calculated)</label>
          <input 
            type="number" 
            id="manaValue" 
            name="manaValue" 
            value={selectedCard?.manaValue || calculateManaValue(selectedCard?.manaCost || '')}
            readOnly 
          />
          <small className="form-text text-muted">
            This value is automatically calculated based on Mana Cost
          </small>
        </div>
        <div className="form-group">
          <label htmlFor="rarity">Rarity</label>
          <select 
            id="rarity" 
            name="rarity" 
            className="admin-rarity-select"
            value={selectedCard?.rarity || 'common'} 
            onChange={(e) => {
              if (selectedCard) {
                setSelectedCard({
                  ...selectedCard,
                  rarity: e.target.value
                });
              }
            }}
            required
          >
            <option key="default-rarity" value="common">Common</option>
            <option key="uncommon" value="uncommon">Uncommon</option>
            <option key="rare" value="rare">Rare</option>
            <option key="mythic" value="mythic">Mythic Rare</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="setId">Set (optional)</label>
          <select 
            id="setId" 
            name="setId" 
            value={selectedCard?.setId || ''}
            onChange={(e) => {
              if (selectedCard) {
                const newSetId = e.target.value ? parseInt(e.target.value) : undefined;
                console.log("Set selection changed:", newSetId);
                setSelectedCard({
                  ...selectedCard,
                  setId: newSetId,
                  set_id: newSetId
                });
              }
            }}
          >
            <option key="default" value="">- No set -</option>
            {sets.length === 0 ? (
              <option key="loading" value="" disabled>Loading sets...</option>
            ) : (
              sets.map(set => {
                const setId = set.id || set.setId; // Ensure compatibility
                return (
                  <option key={setId} value={setId}>
                    {set.name} (ID: {setId})
                  </option>
                );
              })
            )}
          </select>
          <small className="form-text text-muted">
            Currently selected set ID: {selectedCard?.setId || 'None'}
          </small>
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
            defaultValue={selectedCard?.cardImageUrl || selectedCard?.imageUrl || ''} 
          />
        </div>
        <div className="form-buttons">
          <button type="submit" className="btn-primary">
            {selectedCard?.isNewCard ? 'Create' : 'Update'}
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => {
              // Clear form and reset state
              setShowCardForm(false);
              setSelectedCard(null);
              setError(null); // Clear errors
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
              <th>Set Code</th>
              <th>Release Date</th>
              <th>Total Cards</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sets.map(set => (
              <tr key={set.id || set.setId}>
                <td>{set.id || set.setId}</td>
                <td>{set.name}</td>
                <td>{set.setCode}</td>
                <td>{set.releaseDate ? new Date(set.releaseDate).toLocaleDateString() : 'N/A'}</td>
                <td>{set.totalCards || 0}</td>
                <td className="actions">
                  <button onClick={() => handleEditSet(set)}>Edit</button>
                  <button 
                    className="delete" 
                    onClick={() => handleDeleteSet(set.id || set.setId)}
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
        <button className="btn-primary" onClick={() => {
          setSelectedCard(null);
          loadSets();
          setShowCardForm(true);
        }}>
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
                <td>{card.setName || 'Unknown'}</td>
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

  const renderImportCardsTab = () => (
    <div className="admin-tab-content">
      <h3>Import Cards from JSON File</h3>
      <p>Upload a JSON file containing card data to import into the database.</p>
      
      <div className="form-group">
        <label htmlFor="jsonFile">Select JSON File:</label>
        <input 
          type="file" 
          id="jsonFile"
          accept=".json" 
          onChange={handleFileSelect}
          disabled={importLoading} 
        />
      </div>
      
      {selectedFile && (
        <div className="admin-info-box">
          Selected file: <strong>{selectedFile.name}</strong>
          <button 
            className="btn-secondary"
            onClick={() => setSelectedFile(null)}
            disabled={importLoading}
            style={{ marginLeft: '10px' }}
          >
            Clear
          </button>
        </div>
      )}
      
      <div className="admin-actions">
        <button 
          className="btn-primary"
          onClick={handleImportCards}
          disabled={!selectedFile || importLoading}
        >
          {importLoading ? 'Importing...' : 'Import Cards'}
        </button>
      </div>
      
      {importSuccess && (
        <div className="success">
          Cards imported successfully!
        </div>
      )}
      
      {error && (
        <div className="error">
          {error}
        </div>
      )}
    </div>
  );

  return (
    <div className="collection-container">
      <Header />
      <main className="container collection-main">
        <div className="collection-header">
          <h1 className="collection-title">Admin Panel</h1>
          <p className="collection-description">
            Gestiona usuarios, sets, cartas y mazos de Magic: The Gathering.
          </p>
        </div>
        
        {error && (
          <div className="error">{error}</div>
        )}
        
        <div className="collection-tabs">
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
          <button 
            className={`tab-button ${activeTab === 'importCards' ? 'active' : ''}`}
            onClick={() => setActiveTab('importCards')}
          >
            Import Cards
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'sets' && renderSetsTab()}
          {activeTab === 'cards' && renderCardsTab()}
          {activeTab === 'decks' && renderDecksTab()}
          {activeTab === 'importCards' && renderImportCardsTab()}
        </div>
      </main>
    </div>
  );
};

export default Admin; 