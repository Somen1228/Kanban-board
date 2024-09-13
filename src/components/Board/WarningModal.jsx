import React, { useState, useEffect, useRef } from "react";

function WarningModal({ boardName, onDeleteConfirm, onCancel }) {
  const [inputValue, setInputValue] = useState("");
  const modalRef = useRef();

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleDelete = () => {
    if (inputValue === `delete ${boardName}`) {
      onDeleteConfirm();
    }
  };

  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onCancel();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div ref={modalRef} className="bg-white p-6 rounded shadow-lg z-60">
        <h2 className="text-lg font-semibold mb-4">Delete Board</h2>
        <p className="mb-4">
          Type{" "}
          <span className="text-red-500 font-medium bg-gray-300 bg-opacity-25 px-2 py-1 rounded-md">
            delete {boardName}
          </span>{" "}
          to confirm deletion of this board.
        </p>
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          className={`border p-2 w-full mb-4 drop-shadow-sm`}
        />
        <div className="flex justify-end">
          <button
            onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default WarningModal;
