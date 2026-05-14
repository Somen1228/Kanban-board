import React, { useState, useContext, useRef, useEffect } from "react";
import {
  VscLayoutSidebarLeft,
  VscLayoutSidebarLeftOff,
  VscListFilter,
  VscHistory,
} from "react-icons/vsc";
import { CardsContext } from "../contexts/CardsContext";
import Navbar from "../components/Navbar";
import Cards from "../components/Board/Cards";
import BoardMembersModal from "../components/Board/BoardMembersModal";
import ResetWarningModal from "../components/Board/ResetWarningModal";
import { supabase } from "../lib/supabase";

function Board({ user }) {
  const { boards, fetchBoards, loading } = useContext(CardsContext);

  const [activeBoardId, setActiveBoardId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const [showResetWarning, setShowResetWarning] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const sidebarRef = useRef(null);

  /* ---------------- Set Active Board Safely ---------------- */

  useEffect(() => {
    if (!loading && boards.length > 0 && !activeBoardId) {
      setActiveBoardId(boards[0].id);
    }
  }, [boards, loading, activeBoardId]);

  const activeBoard = boards.find((b) => b.id === activeBoardId);

  /* ---------------- Create Board ---------------- */

  const addBoard = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return;

    const { data: board } = await supabase
      .from("boards")
      .insert({ title: "Untitled" })
      .select()
      .single();

    await supabase.from("board_members").insert({
      board_id: board.id,
      user_id: session.user.id,
      role: "owner",
    });

    const defaultColumns = [
      { title: "To-do", color: "bg-gray-200", position: 0 },
      { title: "In-Progress", color: "bg-blue-100", position: 1 },
      { title: "Done", color: "bg-green-100", position: 2 },
    ];

    await supabase.from("cards").insert(
      defaultColumns.map((col) => ({
        ...col,
        board_id: board.id,
      }))
    );

    await fetchBoards();
    setActiveBoardId(board.id);
  };

  /* ---------------- Reset Board ---------------- */

  const resetBoard = async () => {
    if (!activeBoardId) return;

    await supabase.from("cards").delete().eq("board_id", activeBoardId);

    const defaultColumns = [
      { title: "To-do", color: "bg-gray-200", position: 0 },
      { title: "In-Progress", color: "bg-blue-100", position: 1 },
      { title: "Done", color: "bg-green-100", position: 2 },
    ];

    await supabase.from("cards").insert(
      defaultColumns.map((col) => ({
        ...col,
        board_id: activeBoardId,
      }))
    );

    await fetchBoards();
    setShowResetWarning(false);
  };

  /* ---------------- Loading ---------------- */

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading boards...
      </div>
    );
  }

  if (!activeBoard) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-400">
        No boards available
      </div>
    );
  }

  /* ---------------- Filter ---------------- */

  const uniqueColors = [
    ...new Set(activeBoard.cards.map((c) => c.color.trim())),
  ];

  const filteredCards = selectedColor
    ? activeBoard.cards.filter((c) => c.color === selectedColor)
    : activeBoard.cards;

  return (
    <div className="flex flex-col h-screen">
      <Navbar setSearchTerm={setSearchTerm} user={user} />

      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar */}
        <div
          ref={sidebarRef}
          className={`absolute top-16 left-0 bg-gray-50 shadow-xl transition-all duration-300 z-10 h-[80%]
          ${isSidebarOpen ? "w-64" : "w-9"}`}
          onMouseEnter={() => setIsSidebarOpen(true)}
          onMouseLeave={() => setIsSidebarOpen(false)}
        >
          {isSidebarOpen && (
            <div className="p-4">
              <h2 className="mb-4 text-xl font-bold">Projects</h2>

              {boards.map((board) => (
                <div
                  key={board.id}
                  className={`p-2 rounded-md cursor-pointer ${
                    board.id === activeBoardId
                      ? "bg-gray-200 font-medium"
                      : "hover:bg-blue-50 text-gray-600"
                  }`}
                  onClick={() => setActiveBoardId(board.id)}
                >
                  {board.title}
                </div>
              ))}

              <button
                onClick={addBoard}
                className="mt-4 text-gray-500 hover:text-gray-800"
              >
                + New Project
              </button>
            </div>
          )}
        </div>

        {/* Main */}
        <div className="flex-grow overflow-auto p-6">
          <div className="flex justify-between items-center mb-6 ml-10">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen((p) => !p)}>
                {isSidebarOpen ? (
                  <VscLayoutSidebarLeft />
                ) : (
                  <VscLayoutSidebarLeftOff />
                )}
              </button>
              <h1 className="text-3xl font-bold">
                {activeBoard.title}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <VscListFilter />
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="">All</option>
                  {uniqueColors.map((color, index) => (
                    <option key={index} value={color}>
                      {color.charAt(3).toUpperCase() + color.slice(4, -4)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowResetWarning(true)}
                className="text-xl text-gray-600 hover:text-black"
              >
                <VscHistory />
              </button>

              <button
                onClick={() => setShowMembersModal(true)}
                className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Share
              </button>
            </div>
          </div>

          {showMembersModal && (
            <BoardMembersModal
              boardId={activeBoardId}
              onClose={() => setShowMembersModal(false)}
            />
          )}

          <Cards
            boardId={activeBoardId}
            searchTerm={searchTerm}
          />
        </div>
      </div>

      {showResetWarning && (
        <ResetWarningModal
          boardName={activeBoard.title}
          handleResetConfirm={resetBoard}
          handleCancel={() => setShowResetWarning(false)}
        />
      )}
    </div>
  );
}

export default Board;