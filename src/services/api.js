import { auth } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get the current user's Firebase ID token
 */
const getAuthToken = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Not authenticated');
  }
  return await currentUser.getIdToken();
};

/**
 * Make an authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }

  return response.json();
};

/**
 * Board API methods
 */
export const boardsApi = {
  /**
   * Get all boards for the current user
   */
  getAll: async () => {
    const data = await apiRequest('/api/boards');
    return data.boards;
  },

  /**
   * Create a new board
   */
  create: async (board) => {
    const data = await apiRequest('/api/boards', {
      method: 'POST',
      body: JSON.stringify(board),
    });
    return data.board;
  },

  /**
   * Update a board
   */
  update: async (id, updates) => {
    const data = await apiRequest(`/api/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.board;
  },

  /**
   * Delete a board
   */
  delete: async (id) => {
    return apiRequest(`/api/boards/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Bulk sync all boards
   */
  syncAll: async (boards) => {
    return apiRequest('/api/boards', {
      method: 'PUT',
      body: JSON.stringify({ boards }),
    });
  },
};

export default apiRequest;
