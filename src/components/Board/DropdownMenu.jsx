import React, { useContext } from "react";
import { CardsContext } from "../../contexts/CardsContext";

function DropdownMenu({ onEdit, onDelete }) {
  const { boards } = useContext(CardsContext);
  return (
    <div className="absolute right-8 mt-3 w-32 bg-white border border-gray-300 rounded shadow-lg z-20">
      <button
        onClick={onEdit}
        className="block w-full text-sm text-left px-2 py-2 text-gray-700 hover:bg-gray-100"
      >
        Edit Board Title
      </button>
      { boards.length > 1 &&
        <button
        onClick={onDelete}
        className="block w-full text-sm text-left px-2 py-2 text-gray-700 hover:bg-gray-100"
      >
        Delete Board
      </button>}
    </div>
  );
}

export default DropdownMenu;
