import React, { useState, useRef, useEffect, useCallback, useContext } from "react";
import Card from "./Card";
import Modal from "./Modal";
import { CardsContext } from "../../contexts/CardsContext";

function Cards({ boardId, searchTerm }) {
  const { boards, setBoards } = useContext(CardsContext);
  const board = boards.find((b) => b.id === boardId);
  const [toggleModal, setToggleModal] = useState(false);
  const modalRef = useRef(null);
  const [draggedTask, setDraggedTask] = useState(null);

  const addCard = useCallback((title, color) => {
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
  }, [boardId, setBoards]);

  const updateCardTasks = useCallback((cardIndex, tasks) => {
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
  }, [boardId, setBoards]);

  const updateCards = useCallback((updateFn) => {
    setBoards((prevBoards) =>
      prevBoards.map((b) =>
        b.id === boardId ? { ...b, cards: updateFn(b.cards) } : b
      )
    );
  }, [boardId, setBoards]);

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
    e.dataTransfer.setData('text/plain', JSON.stringify({ task, sourceCardIndex }));
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

  return (
    <div>
      <div className="container">
        {board.cards.map((card, cardIndex) => (
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
            onDrop={(e, targetTaskIndex) => handleDrop(e, cardIndex, targetTaskIndex)}
          />
        ))}

        {toggleModal ? (
          <Modal ref={modalRef} addCard={addCard} cards={board.cards} />
        ) : (
          <button onClick={() => setToggleModal(true)} className="add-btn">
            + Add Card
          </button>
        )}
      </div>
    </div>
  );
}

export default Cards;