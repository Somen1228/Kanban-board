import React, {
  useState,
  useRef,
  useEffect,
  useContext,
} from "react";
import Card from "./Card";
import Modal from "./Modal";
import { CardsContext } from "../../contexts/CardsContext";
import { supabase } from "../../lib/supabase";





function Cards({ boardId, searchTerm }) {
  const { boards, fetchBoards } = useContext(CardsContext);
  const board = boards.find((b) => b.id === boardId);

  const [toggleModal, setToggleModal] = useState(false);
  const modalRef = useRef(null);
  const [draggedTask, setDraggedTask] = useState(null);

  if (!board) return null;

  /* ---------------- Add Card ---------------- */

  const addCard = async (title, color) => {
    const position = board.cards.length;

    await supabase.from("cards").insert({
      board_id: boardId,
      title,
      color,
      position,
    });

    await fetchBoards();
    setToggleModal(false);
  };

  /* ---------------- Drag & Drop ---------------- */

  const handleDragStart = (e, task, sourceCardId) => {
    setDraggedTask({ task, sourceCardId });
    e.dataTransfer.setData("text/plain", task.id);
  };

  const handleDrop = async (e, targetCardId, targetTaskIndex) => {
    e.preventDefault();
    if (!draggedTask) return;

    const { task, sourceCardId } = draggedTask;

    if (sourceCardId === targetCardId) return;

    await supabase
      .from("tasks")
      .update({
        card_id: targetCardId,
        position: targetTaskIndex,
      })
      .eq("id", task.id);

    await fetchBoards();
    setDraggedTask(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  /* ---------------- Outside Click for Modal ---------------- */

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

  /* ---------------- Render ---------------- */

  return (
    <div className="pl-10">
      <div className="flex gap-6">
        {board.cards.map((card) => (
          <Card
            key={card.id}
            cardId={card.id}
            title={card.title}
            color={card.color}
            tasks={card.tasks}
            searchTerm={searchTerm}
            onDragStart={(e, task) =>
              handleDragStart(e, task, card.id)
            }
            onDragOver={handleDragOver}
            onDrop={(e, taskIndex) =>
              handleDrop(e, card.id, taskIndex)
            }
          />
        ))}

        {toggleModal ? (
          <Modal ref={modalRef} addCard={addCard} />
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