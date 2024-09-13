import React, { useState, useContext, useRef, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import Cards from "../components/Board/Cards";
import { CardsContext } from "../contexts/CardsContext";
import optionLineLogo from "../assets/option-line.svg";
import WarningModal from "../components/Board/WarningModal";
import DropdownMenu from "../components/Board/DropdownMenu";

function Board() {
  const { boards, setBoards, defaultCards } = useContext(CardsContext);
  const [activeBoard, setActiveBoard] = useState(boards[0]?.id || null);
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [dropdownBoardId, setDropdownBoardId] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dropdownRefs = useRef({});
  const triggerRefs = useRef({});
  const sidebarRef = useRef(null);

  const addBoard = () => {
    const newBoardId = uuidv4();
    const newBoard = { id: newBoardId, title: `Board ${boards.length + 1}`, cards: defaultCards };
    setBoards([...boards, newBoard]);
    setActiveBoard(newBoardId);
    handleTitleClick(newBoardId, `Board ${boards.length + 1}`);
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
    if (boards.some(board => board.title === newBoardTitle && board.id !== boardId)) {
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
    if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
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
    <div className="flex flex-col h-screen">
      <div className="flex-grow flex overflow-hidden">
        <div 
          ref={sidebarRef}
          className={`sidebar bg-gray-100 overflow-y-auto z-10 transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'w-64' : 'w-0'
          } absolute top-0 bottom-0 left-0`}
        >
          <div className="p-4">
            <div className="board-tabs flex flex-col items-start gap-4">
              {boards.map((board) => (
                <div
                  key={board.id}
                  className={`board-tab p-2 w-full border-black cursor-pointer flex transition-colors duration-300 ${
                    board.id === activeBoard
                      ? "text-blue-500 bg-white rounded-md"
                      : "border-transparent text-gray-600 hover:text-blue-500"
                  }`}
                  onClick={() => setActiveBoard(board.id)}
                >
                  {editingBoardId === board.id ? (
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={newBoardTitle}
                        onChange={handleTitleChange}
                        onBlur={() => handleTitleBlur(board.id)}
                        onKeyDown={(e) => handleTitleKeyDown(e, board.id)}
                        className={`w-full overflow-x-auto border-b-2 focus:outline-none ${isDuplicate ? 'border-red-500' : 'border-blue-500'}`}
                        autoFocus
                      />
                      {isDuplicate && (
                        <div className="absolute left-0 z-10 p-3 mt-1 text-red-500 bg-red-100 border-2 border-red-500 text-xs">
                          A board with this title already exists. Please enter a different title.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full flex justify-between items-center relative cursor-pointer">
                      <span
                        onDoubleClick={() => handleTitleClick(board.id, board.title)}
                        className="pr-4"
                      >
                        {board.title}
                      </span>
                      <img
                        src={optionLineLogo}
                        alt="Options"
                        className={`w-auto h-4 cursor-pointer opacity-0 hover:opacity-50 ${board.id === activeBoard && "opacity-50"}`}
                        ref={(el) => (triggerRefs.current[board.id] = el)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDropdownClick(board.id);
                        }}
                      />
                      {dropdownBoardId === board.id && (
                        <div ref={(el) => (dropdownRefs.current[board.id] = el)}>
                          <DropdownMenu
                            onEdit={() => handleTitleClick(board.id, board.title)}
                            onDelete={() => handleDeleteClick(board)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <button
                className="add-board-btn text-blue-500 hover:text-blue-700 mt-4"
                onClick={addBoard}
              >
                + Add Board
              </button>
            </div>
          </div>
        </div>
        <div className="flex-grow overflow-auto">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <button
                  className="mr-4 focus:outline-none"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  {isSidebarOpen ? (
                    <FiChevronLeft className="text-2xl" />
                  ) : (
                    <FiChevronRight className="text-2xl" />
                  )}
                </button>
                <h1 className="text-4xl font-bold">
                  {boards.find(board => board.id === activeBoard)?.title}
                </h1>
              </div>
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 pt-0.5 text-gray-600"
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
                  className="ml-2 text-lg outline-none bg-transparent"
                  type="text"
                  name="search"
                  id="search"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
            <div className="mt-6">
              {boards.map(
                (board) =>
                  board.id === activeBoard && (
                    <Cards key={board.id} boardId={board.id} searchTerm={searchTerm} />
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
    </div>
  );
}

export default Board;