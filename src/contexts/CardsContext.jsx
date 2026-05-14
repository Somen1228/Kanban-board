import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { boardsApi } from '../services/api';

export const CardsContext = createContext();

const defaultCards = [
  { title: "To-do", color: "bg-gray-200", isVisible: true, tasks: {} },
  { title: "In-Progress", color: "bg-blue-100", isVisible: true, tasks: {} },
  { title: "Done", color: "bg-green-100", isVisible: true, tasks: {} },
];

export const CardsProvider = ({ children }) => {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const syncTimeoutRef = useRef(null);
  const isSyncingRef = useRef(false);

  // Load boards from API when user is authenticated
  useEffect(() => {
    const loadBoards = async () => {
      if (user) {
        try {
          const apiBoards = await boardsApi.getAll();
          if (apiBoards && apiBoards.length > 0) {
            setBoards(apiBoards);
          } else {
            // Create a default board for new users
            const defaultBoard = {
              id: uuidv4(),
              title: "Untitled",
              cards: defaultCards,
            };
            setBoards([defaultBoard]);
            // Save default board to backend
            try {
              await boardsApi.create(defaultBoard);
            } catch (err) {
              console.error('Failed to create default board:', err);
            }
          }
        } catch (err) {
          console.error('Failed to load boards:', err);
          // Fallback to localStorage if API fails
          const localBoards = JSON.parse(localStorage.getItem('boards') || '[]');
          if (localBoards.length > 0) {
            setBoards(localBoards);
          } else {
            setBoards([{ id: uuidv4(), title: "Untitled", cards: defaultCards }]);
          }
        }
        setIsLoaded(true);
      } else {
        // Not authenticated — load from localStorage (graceful fallback)
        const localBoards = JSON.parse(localStorage.getItem('boards') || '[]');
        if (localBoards.length > 0) {
          setBoards(localBoards);
        } else {
          setBoards([{ id: uuidv4(), title: "Untitled", cards: defaultCards }]);
        }
        setIsLoaded(true);
      }
    };

    loadBoards();
  }, [user]);

  // Debounced sync to backend when boards change
  const syncToBackend = useCallback(async (boardsToSync) => {
    if (!user || isSyncingRef.current) return;

    isSyncingRef.current = true;
    try {
      await boardsApi.syncAll(boardsToSync);
      // Also save to localStorage as a backup
      localStorage.setItem('boards', JSON.stringify(boardsToSync));
    } catch (err) {
      console.error('Failed to sync boards:', err);
      // Save to localStorage as fallback
      localStorage.setItem('boards', JSON.stringify(boardsToSync));
    } finally {
      isSyncingRef.current = false;
    }
  }, [user]);

  // Watch for board changes and sync with debounce
  useEffect(() => {
    if (!isLoaded) return;

    // Always keep localStorage in sync
    localStorage.setItem('boards', JSON.stringify(boards));

    // Debounced backend sync
    if (user) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        syncToBackend(boards);
      }, 1000); // 1 second debounce
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [boards, isLoaded, user, syncToBackend]);

  return (
    <CardsContext.Provider value={{ boards, setBoards, defaultCards }}>
      {children}
    </CardsContext.Provider>
  );
};