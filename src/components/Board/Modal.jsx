import React, { forwardRef, useEffect } from "react";

const Modal = forwardRef(({ addCard, cards }, ref) => {
  const [cardTitle, setCardTitle] = React.useState("");
  const [selectedColor, setSelectedColor] = React.useState("");
  const [showDuplicateWarning, setShowDuplicateWarning] = React.useState(false);
  const [showColorWarning, setShowColorWarning] = React.useState(false);

  const handleAddCard = () => {
    if (cardTitle.trim() === "") {
        setShowDuplicateWarning(true);
    } else if (cards.some(card => card.title.toLowerCase() === cardTitle.toLowerCase())) {
        setShowDuplicateWarning(true);
    } else if (!selectedColor) {
        setShowColorWarning(true);
    } else {
        addCard(cardTitle, selectedColor);
        setCardTitle("");
        setSelectedColor("");
        setShowDuplicateWarning(false);
        setShowColorWarning(false);
    }
};


  const handleNewCardName = (e) => {
    setCardTitle(e.target.value);
    setShowDuplicateWarning(false); 
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddCard();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      handleKeyPress(e);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cardTitle, selectedColor]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-20">
      <div ref={ref} className="bg-white px-4 pt-4 rounded shadow-lg w-80">
        <input
          className="w-full h-10 resize-none bg-white text-sm p-2 rounded-md drop-shadow-lg border-gray-300 focus:outline-none focus:border-gray-500 placeholder-gray-400 font-normal"
          placeholder="Enter the card title..."
          value={cardTitle}
          onChange={handleNewCardName}
        />
        {showDuplicateWarning && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-2" role="alert">
            <span className="block sm:inline">
                The name '{cardTitle}' is either invalid or already in use on this board. Please provide a unique and valid name for your card.
            </span>
          </div>
        )}
        {showColorWarning && !selectedColor && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mt-2 flex gap-2" role="alert">
            <img width="20" height="20" src="https://img.icons8.com/emoji/48/warning-emoji.png" alt="warning-emoji"/>
            <span className="block sm:inline">
              Please select a priority color.
            </span>
          </div>
        )}
        <div className="flex flex-col items-center mt-4">
          <p className="text-gray-600 text-sm font-medium">Select a priority color</p>
          <div className="flex pt-2 space-x-3">
            <div
              className={`priority-colors bg-pink-200 hover:ring-2 hover:ring-pink-500 ${selectedColor === "bg-pink-200" ? "ring-2 ring-pink-500" : ""}`}
              onClick={() => setSelectedColor("bg-pink-200")}
            ></div>
            <div
              className={`priority-colors bg-sky-200 hover:ring-2 hover:ring-sky-500 ${selectedColor === "bg-sky-200" ? "ring-2 ring-sky-500" : ""}`}
              onClick={() => setSelectedColor("bg-sky-200")}
            ></div>
            <div
              className={`priority-colors bg-teal-200 hover:ring-2 hover:ring-teal-500 ${selectedColor === "bg-teal-200" ? "ring-2 ring-teal-500" : ""}`}
              onClick={() => setSelectedColor("bg-teal-200")}
            ></div>
            <div
              className={`priority-colors bg-yellow-200 hover:ring-2 hover:ring-yellow-500 ${selectedColor === "bg-yellow-200" ? "ring-2 ring-yellow-500" : ""}`}
              onClick={() => setSelectedColor("bg-yellow-200")}
            ></div>
            <div
              className={`priority-colors bg-red-300 hover:ring-2 hover:ring-red-500 ${selectedColor === "bg-red-200" ? "ring-2 ring-red-500" : ""}`}
              onClick={() => setSelectedColor("bg-red-200")}
            ></div>
            <div
              className={`priority-colors bg-purple-200 hover:ring-2 hover:ring-purple-500 ${selectedColor === "bg-purple-200" ? "ring-2 ring-purple-500" : ""}`}
              onClick={() => setSelectedColor("bg-purple-200")}
            ></div>
          </div>
          <div className="mt-4 w-full flex justify-end">
            <button
              onClick={handleAddCard}
              className={`w-full h-10 ${selectedColor} text-black font-medium rounded-t-md hover:bg-opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={!cardTitle || !selectedColor || showDuplicateWarning}
            >
              Add Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Modal;