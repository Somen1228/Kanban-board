import { useState, useContext, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useHotkeys } from "react-hotkeys-hook";
import {
  VscGithubInverted,
  VscSignOut,
  VscFeedback,
} from "react-icons/vsc";
import { CgRename } from "react-icons/cg";
import { AiOutlineDelete } from "react-icons/ai";
import { IoColorFilterOutline } from "react-icons/io5";
import Cards from "../components/Board/Cards";
import { CardsContext } from "../contexts/CardsContext";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import optionLineLogo from "../assets/option-line.svg";
import kandooLogo from "../assets/kandoo-head.png";
import kandooLogoSmiling from "../assets/kandoo-smiling.png";
import WarningModal from "../components/Board/WarningModal";
import DropdownMenu from "../components/Board/DropdownMenu";
import BoardSkeleton from "../components/Board/BoardSkeleton";
import ThemeSettings from "../components/ThemeSettings";
import ShortcutsHelpModal from "../components/ShortcutsHelpModal";
import ContextMenu from "../components/ContextMenu";
import FeedbackModal from "../components/Board/FeedbackModal";

function Board() {
  const { boards, setBoards, defaultCards, isLoaded, wakingUp } = useContext(CardsContext);
  const { user, logout } = useAuth();
  const { currentThemeId, allThemes, setTheme } = useTheme();
  const [activeBoard, setActiveBoard] = useState(boards[0]?.id || null);
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [dropdownBoardId, setDropdownBoardId] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [headerTitleEditing, setHeaderTitleEditing] = useState(false);
  const [headerTitleValue, setHeaderTitleValue]     = useState("");
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [quickAddSignal, setQuickAddSignal] = useState(0);
  const [ctxMenu, setCtxMenu] = useState(null);
  const ctxMenuRef = useRef(ctxMenu);
  useEffect(() => { ctxMenuRef.current = ctxMenu; }, [ctxMenu]);
  const dropdownRefs = useRef({});
  const triggerRefs = useRef({});
  const sidebarRef = useRef(null);
  const searchInputRef = useRef(null);

  // ===== Keyboard shortcuts =====
  // Cmd/Ctrl+K and / focus the search bar
  useHotkeys('mod+k, /', (e) => {
    e.preventDefault();
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  }, { enableOnFormTags: ['input', 'textarea'], preventDefault: true });

  // T cycles to the next theme (only when no input is focused)
  useHotkeys('t', () => {
    if (!allThemes.length) return;
    const idx = allThemes.findIndex((t) => t.id === currentThemeId);
    const next = allThemes[(idx + 1) % allThemes.length];
    setTheme(next.id);
  });

  // ? opens shortcuts help
  useHotkeys('?', () => setShowShortcutsHelp(true));

  // N adds a quick task to the active board's first card
  useHotkeys('n', (e) => {
    e.preventDefault();
    setQuickAddSignal((s) => s + 1);
  });

  // Esc closes any open Board-level overlay
  useHotkeys('esc', () => {
    if (ctxMenu) { setCtxMenu(null); return; }
    if (showShortcutsHelp) { setShowShortcutsHelp(false); return; }
    if (showFeedbackModal) { setShowFeedbackModal(false); return; }
    if (showThemeSettings) { setShowThemeSettings(false); return; }
    if (showWarningModal) { setShowWarningModal(false); setBoardToDelete(null); return; }
    if (editingBoardId) { setEditingBoardId(null); return; }
    if (dropdownBoardId) { setDropdownBoardId(null); return; }
  }, { enableOnFormTags: ['input'] });

  const openBoardContextMenu = (e, board) => {
    e.preventDefault();
    e.stopPropagation();
    const items = [
      { label: "Rename board", icon: <CgRename/>, onClick: () => handleTitleClick(board.id, board.title) },
    ];
    if (boards.length > 1) {
      items.push({ divider: true });
      items.push({ label: "Delete board", icon: <AiOutlineDelete/>, danger: true, onClick: () => handleDeleteClick(board) });
    }
    setCtxMenu({ x: e.clientX, y: e.clientY, items });
  };

  const addBoard = () => {
    const newBoardId = uuidv4();
    const newBoard = {
      id: newBoardId,
      title: `Board ${boards.length + 1}`,
      cards: defaultCards,
    };
    setBoards([...boards, newBoard]);
    setActiveBoard(newBoardId);
    handleTitleClick(newBoardId, `Untitled ${boards.length + 1}`);
  };

  const deleteBoard = (boardId) => {
    const updatedBoards = boards.filter((board) => board.id !== boardId);
    setBoards(updatedBoards);

    if (boardId === activeBoard && updatedBoards.length > 0) {
      setActiveBoard(updatedBoards[0].id);
    } else if (updatedBoards.length === 0) {
      setActiveBoard(null);
    }
  };

  const handleTitleClick = (boardId, currentTitle) => {
    setEditingBoardId(boardId);
    setNewBoardTitle(currentTitle);
    setIsDuplicate(false);
  };

  const handleTitleChange = (e) => {
    setNewBoardTitle(e.target.value);
    setIsDuplicate(false);
  };

  const handleTitleBlur = (boardId) => {
    if (
      boards.some(
        (board) => board.title === newBoardTitle && board.id !== boardId
      )
    ) {
      setIsDuplicate(true);
    } else {
      const updatedBoards = boards.map((board) =>
        board.id === boardId ? { ...board, title: newBoardTitle } : board
      );
      setBoards(updatedBoards);
      setEditingBoardId(null);
      setIsDuplicate(false);
    }
  };

  const handleTitleKeyDown = (e, boardId) => {
    if (e.key === "Enter") {
      handleTitleBlur(boardId);
    }
  };

  const handleDeleteClick = (board) => {
    setBoardToDelete(board);
    setShowWarningModal(true);
  };

  const handleDeleteConfirm = () => {
    deleteBoard(boardToDelete.id);
    setShowWarningModal(false);
    setBoardToDelete(null);
  };

  const handleCancel = () => {
    setShowWarningModal(false);
    setBoardToDelete(null);
  };

  const handleDropdownClick = (boardId) => {
    if (dropdownBoardId === boardId) {
      setDropdownBoardId(null);
    } else {
      setDropdownBoardId(boardId);
    }
  };

  const handleClickOutside = (e) => {
    if (sidebarRef.current && !sidebarRef.current.contains(e.target) && !ctxMenuRef.current) {
      setIsSidebarOpen(false);
    }

    Object.keys(dropdownRefs.current).forEach((boardId) => {
      if (
        dropdownRefs.current[boardId] &&
        !dropdownRefs.current[boardId].contains(e.target) &&
        triggerRefs.current[boardId] &&
        !triggerRefs.current[boardId].contains(e.target)
      ) {
        setDropdownBoardId(null);
      }
    });
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--theme-bg-primary)', color: 'var(--theme-text-primary)' }}>
      <div className="flex-grow flex overflow-hidden">
        <div
          ref={sidebarRef}
          className={`sidebar shadow-xl overflow-y-auto z-10 transition-all duration-300 ease-in-out h-[80%] ${
            isSidebarOpen
              ? "w-64 rounded-md overflow-x-hidden"
              : `w-9 drop-shadow-xl rounded-md overflow-x-hidden`
          } absolute top-16 left-0`}
          style={{ background: 'var(--theme-bg-sidebar)', borderRight: '1px solid var(--theme-border)' }}
          onMouseEnter={() => setIsSidebarOpen(true)}
          onMouseLeave={() => {
            if (ctxMenuRef.current) return;
            setDropdownBoardId(null);
            if (!isSidebarPinned) setIsSidebarOpen(false);
          }}
        >
          {isSidebarOpen && (
            <div className="p-4">
              <h1 className="pl-1 mb-4 text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Projects</h1>
              <div className="board-tabs flex flex-col items-start gap-1">
                {boards.map((board) => (
                  <div
                    key={board.id}
                    className={`board-tab p-2 w-full cursor-pointer flex transition-colors duration-300 rounded-md`}
                    style={
                      board.id === activeBoard
                        ? { background: 'var(--theme-bg-hover)', color: 'var(--theme-text-primary)', fontWeight: 500 }
                        : { color: 'var(--theme-text-secondary)' }
                    }
                    onClick={() => setActiveBoard(board.id)}
                    onContextMenu={(e) => openBoardContextMenu(e, board)}
                  >
                    {editingBoardId === board.id ? (
                      <div className="relative w-full">
                        <input
                          type="text"
                          value={newBoardTitle}
                          onChange={handleTitleChange}
                          onBlur={() => handleTitleBlur(board.id)}
                          onKeyDown={(e) => handleTitleKeyDown(e, board.id)}
                          className={`w-full overflow-x-auto bg-transparent border-b-2 focus:outline-none`}
                          style={{
                            borderColor: isDuplicate ? 'var(--theme-danger)' : 'var(--theme-accent)',
                            color: 'var(--theme-text-primary)',
                          }}
                          autoFocus
                        />
                        {isDuplicate && (
                          <div className="absolute left-0 z-10 p-3 mt-1 text-xs rounded" style={{
                            background: 'var(--theme-danger-bg)',
                            color: 'var(--theme-danger)',
                            border: '2px solid var(--theme-danger)',
                          }}>
                            A board with this title already exists. Please enter
                            a different title.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full flex justify-between items-center relative cursor-pointer">
                        <span
                          onDoubleClick={() =>
                            handleTitleClick(board.id, board.title)
                          }
                          className="pr-4"
                        >
                          {board.title}
                        </span>
                        <img
                          src={optionLineLogo}
                          alt="Options"
                          className={`w-auto h-4 cursor-pointer opacity-0 hover:opacity-50 ${
                            board.id === activeBoard && "opacity-50"
                          }`}
                          style={{ filter: currentThemeId !== 'light' ? 'invert(1)' : 'none' }}
                          ref={(el) => (triggerRefs.current[board.id] = el)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDropdownClick(board.id);
                          }}
                        />
                      </div>
                    )}
                    {dropdownBoardId === board.id && (
                      <div ref={(el) => (dropdownRefs.current[board.id] = el)}>
                        <DropdownMenu
                          onEdit={() => handleTitleClick(board.id, board.title)}
                          onDelete={() => handleDeleteClick(board)}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <button
                  className="add-board-btn opacity-80 mt-4"
                  style={{ color: 'var(--theme-text-muted)' }}
                  onClick={addBoard}
                >
                  + New Project
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex-grow overflow-auto">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <button
                  className="mr-2 focus:outline-none transition-transform duration-200 hover:scale-110"
                  onMouseEnter={() => setIsLogoHovered(true)}
                  onMouseLeave={() => setIsLogoHovered(false)}
                  onClick={() => {
                    setIsSidebarPinned((prev) => {
                      const next = !prev;
                      setIsSidebarOpen(next);
                      return next;
                    });
                  }}
                  title={isSidebarPinned ? 'Click to unpin sidebar' : 'Click to pin sidebar open'}
                  aria-label="Toggle sidebar"
                  aria-pressed={isSidebarPinned}
                >
                  <img
                    src={isLogoHovered ? kandooLogoSmiling : kandooLogo}
                    alt="KanDoo"
                    className="w-12 h-12 object-contain"
                  />
                </button>
                {headerTitleEditing ? (
                  <input
                    type="text"
                    value={headerTitleValue}
                    onChange={e => setHeaderTitleValue(e.target.value)}
                    onBlur={() => {
                      const trimmed = headerTitleValue.trim();
                      if (trimmed && !boards.some(b => b.title === trimmed && b.id !== activeBoard)) {
                        setBoards(prev => prev.map(b => b.id === activeBoard ? { ...b, title: trimmed } : b));
                      }
                      setHeaderTitleEditing(false);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') e.target.blur();
                      if (e.key === 'Escape') { setHeaderTitleEditing(false); }
                    }}
                    className="text-2xl sm:text-3xl font-bold bg-transparent border-b-2 focus:outline-none"
                    style={{ borderColor: 'var(--theme-accent)', color: 'var(--theme-text-primary)', maxWidth: '280px' }}
                    autoFocus
                  />
                ) : (
                  <h1
                    className="text-2xl sm:text-3xl font-bold truncate select-none"
                    style={{ color: 'var(--theme-text-primary)', cursor: 'text' }}
                    onDoubleClick={() => {
                      const b = boards.find(b => b.id === activeBoard);
                      if (b) { setHeaderTitleValue(b.title); setHeaderTitleEditing(true); }
                    }}
                    title="Double-click to rename"
                  >
                    {boards.find((board) => board.id === activeBoard)?.title}
                  </h1>
                )}
              </div>
              <div className="flex justify-center items-center">
                <div className="flex items-center rounded-3xl px-2 py-1 mr-5" style={{
                  border: '1px solid var(--theme-border)',
                  background: 'var(--theme-bg-input)',
                }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 pt-0.5"
                    style={{ color: 'var(--theme-text-secondary)' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    ref={searchInputRef}
                    className="ml-2 text-md outline-none bg-transparent"
                    style={{ color: 'var(--theme-text-primary)' }}
                    type="text"
                    name="search"
                    id="search"
                    placeholder="Search (⌘K or /)"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
                {/* Theme Toggle Button */}
                <button
                  className="text-xl mr-5 transition-transform duration-200 hover:scale-110"
                  style={{ color: 'var(--theme-text-secondary)' }}
                  onClick={() => setShowThemeSettings(true)}
                  title="Theme Settings"
                >
                  <IoColorFilterOutline />
                </button>
                {/* Feedback Button */}
                <button
                  className="text-xl mr-5 transition-transform duration-200 hover:scale-110"
                  style={{ color: 'var(--theme-text-secondary)' }}
                  onClick={() => setShowFeedbackModal(true)}
                  title="Send Feedback"
                >
                  <VscFeedback />
                </button>
                <div className="github-link text-xl mr-5" title="Github Repository Link" style={{ color: 'var(--theme-text-secondary)' }}>
                  <a
                    target="_blank"
                    href="https://github.com/Somen1228/Kanban-board"
                  >
                    <VscGithubInverted />
                  </a>
                </div>
                {/* User Profile & Logout */}
                <div className="flex items-center gap-3 ml-2">
                  {user?.photoUrl ? (
                    <img
                      src={user.photoUrl}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full object-cover"
                      style={{ border: '2px solid var(--theme-border)' }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--theme-accent)' }}>
                      {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate" style={{ color: 'var(--theme-text-secondary)' }}>
                    {user?.displayName || user?.email || user?.phone || 'User'}
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        await logout();
                        toast.success('Signed out');
                      } catch {
                        toast.error("Couldn't sign out — please try again");
                      }
                    }}
                    className="transition-colors duration-200"
                    style={{ color: 'var(--theme-text-muted)' }}
                    title="Sign Out"
                    onMouseEnter={(e) => e.target.style.color = 'var(--theme-danger)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--theme-text-muted)'}
                  >
                    <VscSignOut className="text-lg" />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6">
              {!isLoaded ? (
                <BoardSkeleton message={wakingUp ? 'Waking the server — this can take up to 30 seconds on the first request' : null} />
              ) : (
                boards.map(
                  (board) =>
                    board.id === activeBoard && (
                      <Cards
                        key={board.id}
                        boardId={board.id}
                        searchTerm={searchTerm}
                        quickAddSignal={quickAddSignal}
                      />
                    )
                )
              )}
            </div>
          </div>
        </div>
      </div>
      {showWarningModal && (
        <WarningModal
          boardName={boardToDelete?.title}
          onDeleteConfirm={handleDeleteConfirm}
          onCancel={handleCancel}
        />
      )}
      {showThemeSettings && (
        <ThemeSettings onClose={() => setShowThemeSettings(false)} />
      )}
      {showShortcutsHelp && (
        <ShortcutsHelpModal onClose={() => setShowShortcutsHelp(false)} />
      )}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxMenu.items}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}

export default Board;
