import React, { useState, useEffect, useRef, useContext } from "react";
import { CardsContext } from "../../contexts/CardsContext";
import { supabase } from "../../lib/supabase";
import pencilLogo from "../../assets/pencil.svg";
import DeleteWarningModal from "./DeleteWarningModal.jsx";
import DefaultModal from "./DefaultModal.jsx";

function Card({
  cardId,
  title,
  color,
  tasks,
  searchTerm,
  onDragStart,
  onDragOver,
  onDrop,
}) {
  const { fetchBoards } = useContext(CardsContext);

  const [isMounted, setIsMounted] = useState(false);
  const [toggleAddTask, setToggleAddTask] = useState(false);
  const [taskValue, setTaskValue] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskValue, setEditingTaskValue] = useState("");

  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => setIsMounted(true), 10);
  }, []);

  /* ---------------- Add Task ---------------- */

  const addTask = async (e) => {
    e.preventDefault();
    if (!taskValue.trim()) return;

    await supabase.from("tasks").insert({
      card_id: cardId,
      title: taskValue.trim(),
      position: tasks.length,
    });

    setTaskValue("");
    setToggleAddTask(false);
    await fetchBoards();
  };

  /* ---------------- Delete Task ---------------- */

  const deleteTask = async (taskId) => {
    await supabase.from("tasks").delete().eq("id", taskId);
    await fetchBoards();
  };

  /* ---------------- Edit Task ---------------- */

  const saveEditedTask = async (taskId) => {
    await supabase
      .from("tasks")
      .update({ title: editingTaskValue.trim() })
      .eq("id", taskId);

    setEditingTaskId(null);
    setEditingTaskValue("");
    await fetchBoards();
  };

  /* ---------------- Delete All Tasks ---------------- */

  const deleteAllTasks = async () => {
    if (!tasks.length) return;
    await supabase.from("tasks").delete().eq("card_id", cardId);
    await fetchBoards();
  };

  /* ---------------- Delete Card ---------------- */

  const deleteCard = async () => {
    await supabase.from("cards").delete().eq("id", cardId);
    await fetchBoards();
  };

  /* ---------------- Highlight ---------------- */

  const highlightText = (text, term) => {
    if (!term?.trim()) return text;
    const parts = text.split(new RegExp(`(${term})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <span key={i} className="bg-yellow-200">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div
      className={`card transition-all duration-300 ease-in-out transform ${
        isMounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
      } bg-white shadow-lg relative`}
    >
      {/* Card Title */}
      <div
        className={`card-title ${color} flex justify-between items-center text-sm`}
      >
        <h5 className="font-semibold px-2">
          {highlightText(title, searchTerm)}
        </h5>

        <div className="flex items-center gap-3 pr-2">
          <span className="text-xs bg-black/10 px-2 rounded">
            {tasks.length}
          </span>

          <button
            onClick={deleteCard}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tasks */}
      <div className="task-list max-h-[30rem] overflow-y-auto p-2">
        {tasks.length ? (
          tasks.map((task, index) => (
            <div
              key={task.id}
              className="task-item flex flex-col p-2 mt-2 bg-white shadow-sm rounded-md cursor-grab"
              draggable
              onDragStart={(e) => onDragStart(e, task)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, index)}
            >
              {editingTaskId === task.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveEditedTask(task.id);
                  }}
                  className="flex items-center"
                >
                  <input
                    value={editingTaskValue}
                    onChange={(e) => setEditingTaskValue(e.target.value)}
                    className="w-full border p-1 rounded"
                    autoFocus
                  />
                </form>
              ) : (
                <div className="flex justify-between items-center">
                  <p className="text-sm">
                    {highlightText(task.title, searchTerm)}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingTaskId(task.id);
                        setEditingTaskValue(task.title);
                      }}
                    >
                      <img src={pencilLogo} alt="Edit" />
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-500 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div
            className="opacity-30 text-sm"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, 0)}
          >
            Drop tasks here
          </div>
        )}
      </div>

      {/* Add Task */}
      {toggleAddTask ? (
        <form onSubmit={addTask} ref={inputRef} className="p-2">
          <input
            value={taskValue}
            onChange={(e) => setTaskValue(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter task"
            autoFocus
          />
        </form>
      ) : (
        <div
          onClick={() => setToggleAddTask(true)}
          className="m-2 text-gray-500 cursor-pointer hover:bg-gray-100 rounded p-2"
        >
          + Create Task
        </div>
      )}

      {/* Delete All */}
      <div className="px-2 pb-2">
        <button
          onClick={deleteAllTasks}
          className="text-xs text-gray-500 hover:text-red-600"
        >
          Delete All Tasks
        </button>
      </div>
    </div>
  );
}

export default Card;