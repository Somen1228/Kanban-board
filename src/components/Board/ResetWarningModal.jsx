import React, { useState, useEffect, useRef } from "react";

function ResetWarningModal({ boardName, handleResetConfirm, handleCancel }) {
  const [inputValue, setInputValue] = useState("");
  const modalRef = useRef();

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleReset = () => {
    if (inputValue === `reset ${boardName}`) {
      handleResetConfirm();
    }
  };

  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      handleCancel();
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
        <h2 className="text-lg font-semibold mb-4">Reset Board</h2>
        <p className="mb-4">
          Are you sure you want to reset this board? This action cannot be
          undone.
        </p>
        <p className=" mb-2">
          To confirm, type{" "}
          <span className="text-red-500 font-medium bg-gray-300 bg-opacity-25 px-2 py-1 rounded-md">
            reset {boardName}
          </span>{" "}
          below.
        </p>
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          className={`border p-2 w-full mb-4 drop-shadow-sm`}
        />
        <div className="flex justify-end">
          <button
            onClick={handleCancel}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleReset}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetWarningModal;
