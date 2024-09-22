import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useContext,
} from "react";
import Card from "./Card";
import Modal from "./Modal";
import { CardsContext } from "../../contexts/CardsContext";
import { VscHistory, VscListFilter } from "react-icons/vsc";
import WarningModal from "./WarningModal";
import ResetWarningModal from "./ResetWarningModal";
import { BiReset } from "react-icons/bi";

function Cards({ boardId, searchTerm }) {
  const { boards, setBoards, defaultCards } = useContext(CardsContext);
  const board = boards.find((b) => b.id === boardId);
  const [toggleModal, setToggleModal] = useState(false);
  const modalRef = useRef(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [warningBoardReset, setWarningBoardReset] = useState(false);

  const addCard = useCallback(
    (title, color) => {
      const newCard = { title, color, isVisible: false, tasks: {} };

      setBoards((prevBoards) =>
        prevBoards.map((b) =>
          b.id === boardId ? { ...b, cards: [...b.cards, newCard] } : b
        )
      );

      setTimeout(() => {
        setBoards((prevBoards) =>
          prevBoards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  cards: b.cards.map((card, index) =>
                    index === b.cards.length - 1
                      ? { ...card, isVisible: true }
                      : card
                  ),
                }
              : b
          )
        );
      }, 10);
      setToggleModal(false);
    },
    [boardId, setBoards]
  );

  const updateCardTasks = useCallback(
    (cardIndex, tasks) => {
      setBoards((prevBoards) =>
        prevBoards.map((b) =>
          b.id === boardId
            ? {
                ...b,
                cards: b.cards.map((card, i) =>
                  i === cardIndex ? { ...card, tasks } : card
                ),
              }
            : b
        )
      );
    },
    [boardId, setBoards]
  );

  const updateCards = useCallback(
    (updateFn) => {
      setBoards((prevBoards) =>
        prevBoards.map((b) =>
          b.id === boardId ? { ...b, cards: updateFn(b.cards) } : b
        )
      );
    },
    [boardId, setBoards]
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setToggleModal(false);
      }
    };

    if (toggleModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [toggleModal]);

  const handleDragStart = (e, task, sourceCardIndex) => {
    setDraggedTask({ task, sourceCardIndex });
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ task, sourceCardIndex })
    );
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetCardIndex, targetTaskIndex) => {
    e.preventDefault();
    if (draggedTask && draggedTask.sourceCardIndex !== targetCardIndex) {
      const { task, sourceCardIndex } = draggedTask;

      setBoards((prevBoards) =>
        prevBoards.map((b) =>
          b.id === boardId
            ? {
                ...b,
                cards: b.cards.map((card, index) => {
                  if (index === sourceCardIndex) {
                    const updatedTasks = { ...card.tasks };
                    delete updatedTasks[task.id];
                    return { ...card, tasks: updatedTasks };
                  }
                  if (index === targetCardIndex) {
                    const updatedTasks = { ...card.tasks };
                    const taskEntries = Object.entries(updatedTasks);
                    taskEntries.splice(targetTaskIndex, 0, [task.id, task]);
                    return { ...card, tasks: Object.fromEntries(taskEntries) };
                  }
                  return card;
                }),
              }
            : b
        )
      );
    }
    setDraggedTask(null);
  };

  const handleColorFilterChange = (e) => {
    setSelectedColor(e.target.value);
  };

  const uniqueColors = [
    ...new Set(board.cards.map((card) => card.color.trim())),
  ];

  const filteredCards = selectedColor
    ? board.cards.filter((card) => card.color === selectedColor)
    : board.cards;

  const resetBoard = () => {
    setBoards((prev) => {
      const updatedBoards = prev.map((b) => {
        if (b.id === board.id) {
          return {
            ...b,
            cards: defaultCards,
          };
        }
        return b;
      });
      return updatedBoards;
    });
  };

  const handleResetClick = () => {
    setWarningBoardReset(true);
  };

  const handleResetConfirm = () => {
    resetBoard();
    setWarningBoardReset(false);
  };

  const handleCancel = () => {
    setWarningBoardReset(false);
  };

  return (
    <div>
      <div className="pl-10 option-container mb-4 w-auto ">
        <div className="flex items-center justify-between">
          <div className="filter-board flex items-center" title="Filter cards by color">
            <label htmlFor="colorFilter">
              <VscListFilter />
            </label>
            <select
              id="colorFilter"
              value={selectedColor}
              onChange={handleColorFilterChange}
            >
              <option value="">All</option>
              {uniqueColors.map((color, index) => (
                <option key={index} value={color}>
                  {color.charAt(3).toUpperCase() + color.slice(4, -4)}
                </option>
              ))}
            </select>
          </div>
          <div className="reset-board text-xl mr-5">
            <button onClick={handleResetClick} title="Reset board to default"><VscHistory /></button>
          </div>
        </div>
      </div>
      <div className="container pl-10">
        {filteredCards.map((card, cardIndex) => (
          <Card
            key={cardIndex}
            index={cardIndex}
            title={card.title}
            color={card.color}
            isVisible={card.isVisible}
            tasks={card.tasks}
            updateCardTasks={updateCardTasks}
            updateCards={updateCards}
            searchTerm={searchTerm}
            cards={board.cards}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={(e, targetTaskIndex) =>
              handleDrop(e, cardIndex, targetTaskIndex)
            }
          />
        ))}

        {toggleModal ? (
          <Modal ref={modalRef} addCard={addCard} cards={board.cards} />
        ) : (
          <button onClick={() => setToggleModal(true)} className="add-btn">
            + Add Card
          </button>
        )}

        {warningBoardReset && (
          <ResetWarningModal
            boardName={board.title}
            handleResetConfirm={handleResetConfirm}
            handleCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}

export default Cards;
