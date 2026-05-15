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
    <div className="fixed inset-0 flex items-center justify-center z-20" style={{ background: 'var(--theme-bg-overlay)' }}>
      <div ref={ref} className="px-4 pt-4 rounded shadow-lg w-80" style={{ background: 'var(--theme-bg-modal)', border: '1px solid var(--theme-border)' }}>
        <input
          className="w-full h-10 resize-none text-sm p-2 rounded-md drop-shadow-lg focus:outline-none font-normal"
          style={{
            background: 'var(--theme-bg-input)',
            color: 'var(--theme-text-primary)',
            border: '1px solid var(--theme-border)',
          }}
          placeholder="Enter the card title..."
          value={cardTitle}
          onChange={handleNewCardName}
        />
        {showDuplicateWarning && (
          <div className="px-4 py-3 rounded relative mt-2" role="alert" style={{
            background: 'var(--theme-danger-bg)',
            border: '1px solid var(--theme-danger)',
            color: 'var(--theme-danger)',
          }}>
            <span className="block sm:inline text-sm">
                The name '{cardTitle}' is either invalid or already in use on this board. Please provide a unique and valid name for your card.
            </span>
          </div>
        )}
        {showColorWarning && !selectedColor && (
          <div className="px-4 py-3 rounded relative mt-2 flex gap-2" role="alert" style={{
            background: 'rgba(234,179,8,0.12)',
            border: '1px solid var(--theme-warning)',
            color: 'var(--theme-warning)',
          }}>
            <img width="20" height="20" src="https://img.icons8.com/emoji/48/warning-emoji.png" alt="warning-emoji"/>
            <span className="block sm:inline text-sm">
              Please select a priority color.
            </span>
          </div>
        )}
        <div className="flex flex-col items-center mt-4">
          <p className="text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>Select a priority color</p>
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
              className={`w-full h-10 ${selectedColor} font-medium rounded-t-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ color: 'var(--theme-text-primary)' }}
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