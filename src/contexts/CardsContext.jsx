import { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { boardsApi } from '../services/api';

export const CardsContext = createContext();

const defaultCards = [
  { uid: 'col-todo', title: "To-do", color: "bg-gray-200", isVisible: true, tasks: {} },
  { uid: 'col-inprogress', title: "In-Progress", color: "bg-blue-100", isVisible: true, tasks: {} },
  { uid: 'col-done', title: "Done", color: "bg-green-100", isVisible: true, tasks: {} },
];

const ensureCardUids = (boards) =>
  boards.map(b => ({
    ...b,
    cards: b.cards.map(c => c.uid ? c : { ...c, uid: uuidv4() }),
  }));

const WAKE_UP_DELAY_MS = 2000;
const SYNC_DEBOUNCE_MS = 1000;
const HISTORY_LIMIT = 50;
const HISTORY_DEBOUNCE_MS = 400;

export const CardsProvider = ({ children }) => {
  const { user } = useAuth();
  const [boards, setBoardsRaw] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);
  const [history, setHistory] = useState({ past: [], future: [] });
  const syncTimeoutRef = useRef(null);
  const isSyncingRef = useRef(false);
  const lastSyncOkRef = useRef(true);

  // ── History internals ────────────────────────────────────────────────────
  const skipHistoryRef     = useRef(false); // bypass capture for system updates
  const pendingSnapshotRef = useRef(null);  // first prev in a rapid-change burst
  const snapshotTimerRef   = useRef(null);
  const boardsRef          = useRef(boards);
  const historyRef         = useRef(history);
  useEffect(() => { boardsRef.current  = boards;  }, [boards]);
  useEffect(() => { historyRef.current = history; }, [history]);

  const flushPendingSnapshot = useCallback(() => {
    if (snapshotTimerRef.current) {
      clearTimeout(snapshotTimerRef.current);
      snapshotTimerRef.current = null;
    }
    const snap = pendingSnapshotRef.current;
    pendingSnapshotRef.current = null;
    if (snap !== null) {
      setHistory(h => ({
        past: [...h.past, snap].slice(-HISTORY_LIMIT),
        future: [],
      }));
    }
  }, []);

  // Wrapped setter — debounced history capture, records the FIRST prev in a burst
  const setBoards = useCallback((updater) => {
    setBoardsRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (!skipHistoryRef.current) {
        if (pendingSnapshotRef.current === null) pendingSnapshotRef.current = prev;
        if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
        snapshotTimerRef.current = setTimeout(() => {
          const snap = pendingSnapshotRef.current;
          pendingSnapshotRef.current = null;
          snapshotTimerRef.current = null;
          if (snap !== null) {
            setHistory(h => ({
              past: [...h.past, snap].slice(-HISTORY_LIMIT),
              future: [],
            }));
          }
        }, HISTORY_DEBOUNCE_MS);
      }
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    flushPendingSnapshot();
    const h = historyRef.current;
    if (h.past.length === 0) return;
    const prev = h.past[h.past.length - 1];
    skipHistoryRef.current = true;
    setBoardsRaw(prev);
    setHistory({
      past: h.past.slice(0, -1),
      future: [boardsRef.current, ...h.future].slice(0, HISTORY_LIMIT),
    });
    queueMicrotask(() => { skipHistoryRef.current = false; });
  }, [flushPendingSnapshot]);

  const redo = useCallback(() => {
    flushPendingSnapshot();
    const h = historyRef.current;
    if (h.future.length === 0) return;
    const next = h.future[0];
    skipHistoryRef.current = true;
    setBoardsRaw(next);
    setHistory({
      past: [...h.past, boardsRef.current].slice(-HISTORY_LIMIT),
      future: h.future.slice(1),
    });
    queueMicrotask(() => { skipHistoryRef.current = false; });
  }, [flushPendingSnapshot]);

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
            setBoardsRaw(ensureCardUids(apiBoards));
          } else {
            const defaultBoard = {
              id: uuidv4(),
              title: "Untitled",
              cards: defaultCards,
            };
            setBoardsRaw([defaultBoard]);
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
            setBoardsRaw(ensureCardUids(localBoards));
            toast.warning('Loaded offline copy — backend unreachable');
          } else {
            setBoardsRaw([{ id: uuidv4(), title: "Untitled", cards: defaultCards }]);
          }
          lastSyncOkRef.current = false;
        }
        finishLoad();
      } else {
        const localBoards = JSON.parse(localStorage.getItem('boards') || '[]');
        if (localBoards.length > 0) {
          setBoardsRaw(ensureCardUids(localBoards));
        } else {
          setBoardsRaw([{ id: uuidv4(), title: "Untitled", cards: defaultCards }]);
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
    <CardsContext.Provider value={{
      boards, setBoards, defaultCards, isLoaded, wakingUp,
      undo, redo,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
    }}>
      {children}
    </CardsContext.Provider>
  );
};
