import React, { useState, useEffect, useRef } from "react";

function ResetWarningModal({ boardName, handleResetConfirm, handleCancel }) {
  const [inputValue, setInputValue] = useState("");
  const [animateIn, setAnimateIn] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    setAnimateIn(true);
  }, []);

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div
            ref={modalRef}
            className={`bg-white w-[26rem] rounded-xl shadow-2xl p-6 transform transition-all duration-300
        ${animateIn ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        >
          {/* icon */}
          <div className="flex justify-center mb-3">
            <span className="text-3xl">⚠️</span>
          </div>

          {/* title */}
          <h2 className="text-lg font-semibold text-center text-gray-800">
            Reset Board
          </h2>

          {/* description */}
          <p className="text-sm text-gray-500 text-center mt-2">
            This will permanently remove all cards and tasks from the board.
          </p>

          {/* instruction */}
          <p className="text-sm text-gray-600 mt-4">
            To confirm, type{" "}
            <span className="text-red-500 font-medium bg-gray-100 px-2 py-1 rounded-md">
            reset {boardName}
          </span>{" "}
            below.
          </p>

          {/* input */}
          <input
              type="text"
              value={inputValue}
              onChange={handleChange}
              className="mt-3 border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder={`reset ${boardName}`}
          />

          {/* actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
                onClick={handleCancel}
                className="px-5 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm font-medium
                       hover:bg-gray-300 transition"
            >
              Cancel
            </button>

            <button
                onClick={handleReset}
                className={`px-5 py-2 rounded-lg text-white text-sm font-medium transition
              ${
                    inputValue === `reset ${boardName}`
                        ? "bg-red-500 hover:bg-red-600 active:scale-95"
                        : "bg-red-300 cursor-not-allowed"
                }`}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
  );
}

export default ResetWarningModal;