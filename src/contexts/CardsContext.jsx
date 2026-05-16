import { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { boardsApi } from '../services/api';

export const CardsContext = createContext();

const defaultCards = [
  { title: "To-do", color: "bg-gray-200", isVisible: true, tasks: {} },
  { title: "In-Progress", color: "bg-blue-100", isVisible: true, tasks: {} },
  { title: "Done", color: "bg-green-100", isVisible: true, tasks: {} },
];

const WAKE_UP_DELAY_MS = 2000;
const SYNC_DEBOUNCE_MS = 1000;

export const CardsProvider = ({ children }) => {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);
  const syncTimeoutRef = useRef(null);
  const isSyncingRef = useRef(false);
  const lastSyncOkRef = useRef(true);

  useEffect(() => {
    let loadCompleted = false;
    const wakeTimer = setTimeout(() => {
      if (!loadCompleted) setWakingUp(true);
    }, WAKE_UP_DELAY_MS);

    const finishLoad = () => {
      loadCompleted = true;
      clearTimeout(wakeTimer);
      setWakingUp(false);
      setIsLoaded(true);
    };

    const loadBoards = async () => {
      if (user) {
        try {
          const apiBoards = await boardsApi.getAll();
          if (apiBoards && apiBoards.length > 0) {
            setBoards(apiBoards);
          } else {
            const defaultBoard = {
              id: uuidv4(),
              title: "Untitled",
              cards: defaultCards,
            };
            setBoards([defaultBoard]);
            try {
              await boardsApi.create(defaultBoard);
            } catch (err) {
              console.error('Failed to create default board:', err);
            }
          }
        } catch (err) {
          console.error('Failed to load boards:', err);
          const localBoards = JSON.parse(localStorage.getItem('boards') || '[]');
          if (localBoards.length > 0) {
            setBoards(localBoards);
            toast.warning('Loaded offline copy — backend unreachable');
          } else {
            setBoards([{ id: uuidv4(), title: "Untitled", cards: defaultCards }]);
          }
          lastSyncOkRef.current = false;
        }
        finishLoad();
      } else {
        const localBoards = JSON.parse(localStorage.getItem('boards') || '[]');
        if (localBoards.length > 0) {
          setBoards(localBoards);
        } else {
          setBoards([{ id: uuidv4(), title: "Untitled", cards: defaultCards }]);
        }
        finishLoad();
      }
    };

    loadBoards();

    return () => {
      clearTimeout(wakeTimer);
    };
  }, [user]);

  const syncToBackend = useCallback(async (boardsToSync) => {
    if (!user || isSyncingRef.current) return;

    isSyncingRef.current = true;
    try {
      await boardsApi.syncAll(boardsToSync);
      localStorage.setItem('boards', JSON.stringify(boardsToSync));
      if (!lastSyncOkRef.current) {
        toast.success('Reconnected — changes saved');
        lastSyncOkRef.current = true;
      }
    } catch (err) {
      console.error('Failed to sync boards:', err);
      localStorage.setItem('boards', JSON.stringify(boardsToSync));
      if (lastSyncOkRef.current) {
        toast.error("Saved locally — we'll retry when the server is back");
        lastSyncOkRef.current = false;
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (!isLoaded) return;

    localStorage.setItem('boards', JSON.stringify(boards));

    if (user) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        syncToBackend(boards);
      }, SYNC_DEBOUNCE_MS);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [boards, isLoaded, user, syncToBackend]);

  return (
    <CardsContext.Provider value={{ boards, setBoards, defaultCards, isLoaded, wakingUp }}>
      {children}
    </CardsContext.Provider>
  );
};
