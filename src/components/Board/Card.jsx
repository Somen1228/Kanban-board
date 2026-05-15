import React, { useState, useEffect, useRef } from "react";
import { generateTaskID } from "../../utils/taskIdGenerator";
import { useTheme } from "../../contexts/ThemeContext";
import pencilLogo from "../../assets/pencil.svg";
import "./DropArea.css";
import DeleteWarningModal from "./DeleteWarningModal.jsx";
import DefaultModal from "./DefaultModal.jsx";

// Maps Tailwind color class → { bg, text } for light and dark themes
const CARD_COLORS = {
  light: {
    'bg-pink-200':   { bg: '#fbcfe8', text: '#1e293b' },
    'bg-sky-200':    { bg: '#bae6fd', text: '#1e293b' },
    'bg-teal-200':   { bg: '#99f6e4', text: '#1e293b' },
    'bg-yellow-200': { bg: '#fef08a', text: '#1e293b' },
    'bg-red-200':    { bg: '#fecaca', text: '#1e293b' },
    'bg-red-300':    { bg: '#fca5a5', text: '#1e293b' },
    'bg-purple-200': { bg: '#e9d5ff', text: '#1e293b' },
  },
  dark: {
    'bg-pink-200':   { bg: '#831843', text: '#fce7f3' },
    'bg-sky-200':    { bg: '#1e3a5f', text: '#bae6fd' },
    'bg-teal-200':   { bg: '#134e4a', text: '#99f6e4' },
    'bg-yellow-200': { bg: '#713f12', text: '#fef08a' },
    'bg-red-200':    { bg: '#7f1d1d', text: '#fecaca' },
    'bg-red-300':    { bg: '#7f1d1d', text: '#fca5a5' },
    'bg-purple-200': { bg: '#4c1d95', text: '#e9d5ff' },
  },
};

function Card({
  index,
  title,
  color,
  isVisible,
  tasks,
  updateCardTasks,
  updateCards,
  searchTerm,
  cards,
  onDragStart,
  onDragOver,
  onDrop,
}) {
  const { currentThemeId } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [toggleAddTask, setToggleAddTask] = useState(false);
  const [toggleMenu, setToggleMenu] = useState(false);
  const [taskValue, setTaskValue] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskValue, setEditingTaskValue] = useState("");
  const [doneTasks, setDoneTasks] = useState({});
  const [isComingOver, setIsComingOver] = useState(false);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [toDelete, setToDelete] = useState("");
  const [defaultModal, setDefaultModal] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => setIsMounted(true), 10);
    }
  }, [isVisible]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setToggleAddTask(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [inputRef, menuRef]);

  const toggleInput = () => {
    setToggleAddTask((prev) => !prev);
  };

  const handleInputChange = (e) => {
    setTaskValue(e.target.value);
  };

  const handleEditChange = (e) => {
    setEditingTaskValue(e.target.value);
  };

  const addTask = (e) => {
    e.preventDefault();
    if (taskValue.trim() === "") {
      setToggleAddTask((prev) => !prev);
      return;
    }

    const newTask = {
      id: generateTaskID(title),
      value: taskValue,
    };
    updateCardTasks(index, { ...tasks, [newTask.id]: newTask });
    setTaskValue("");
    setToggleAddTask(true);
  };

  const deleteTask = (taskId) => {
    const updatedTasks = { ...tasks };
    delete updatedTasks[taskId];
    updateCardTasks(index, updatedTasks);
  };

  const startEditingTask = (taskId, taskValue) => {
    setEditingTaskId(taskId);
    setEditingTaskValue(taskValue);
  };

  const saveEditedTask = (taskId, newTaskContent) => {
    const updatedTasks = {
      ...tasks,
      [taskId]: { ...tasks[taskId], value: newTaskContent },
    };
    updateCardTasks(index, updatedTasks);
    setEditingTaskId(null);
    setEditingTaskValue("");
  };

  const handleDeleteCard = () => {
    setToggleMenu(false);
    setToDelete("card");
    setShowDeleteWarning(true);
  };

  const deleteAllTasks = () => {
    setToggleMenu(false);
    setToDelete("tasks");
    Object.keys(tasks).length > 0 ? setShowDeleteWarning(true) : setDefaultModal(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        menuTriggerRef.current &&
        !menuTriggerRef.current.contains(event.target)
      ) {
        setToggleMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const highlightText = (text, term) => {
    if (!term?.trim()) return text;

    const parts = text.split(new RegExp(`(${term})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <span key={i} style={{ background: 'var(--theme-highlight-bg)', borderRadius: '2px', padding: '0 2px' }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const toggleDoneTask = (taskId) => {
    setDoneTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleDrop = (e, targetTaskIndex) => {
    setIsComingOver(false);
    onDrop(e, targetTaskIndex);
  };

  return (
    <div
      className={`card transition-all duration-300 ease-in-out transform ${
        isMounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
      } shadow-lg relative`}
      style={{ background: 'var(--theme-bg-card)' }}
    >
      {toggleMenu && (
        <div
          ref={menuRef}
          className="title-option-menu absolute h-auto w-32 drop-shadow-md top-6 right-2 z-30 flex flex-col items-start justify-around rounded-lg"
          style={{ background: 'var(--theme-bg-modal)', border: '1px solid var(--theme-border)' }}
        >
          {title !== "To-do" && title !== "In-Progress" && title !== "Done" && (
            <>
              <p
                className="p-2 w-full cursor-pointer rounded-t-lg text-sm"
                style={{ color: 'var(--theme-text-primary)' }}
                onMouseEnter={(e) => e.target.style.background = 'var(--theme-bg-hover)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                onClick={handleDeleteCard}
              >
                Delete Card
              </p>
            </>
          )}
          <p
            className="p-2 w-full cursor-pointer rounded-lg text-sm"
            style={{ color: 'var(--theme-text-primary)' }}
            onMouseEnter={(e) => e.target.style.background = 'var(--theme-bg-hover)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
            onClick={deleteAllTasks}
          >
            Delete All Tasks
          </p>
        </div>
      )}
      {(() => {
        const isDark = ['dark','midnight','forest','sunset'].includes(currentThemeId);
        const palette = isDark ? CARD_COLORS.dark : CARD_COLORS.light;
        const cardColor = palette[color] || { bg: 'var(--theme-accent)', text: '#fff' };
        return (
          <div
            className="card-title flex justify-between items-center text-sm cursor-pointer"
            style={{ backgroundColor: cardColor.bg, color: cardColor.text }}
          >
            <div className="h-full flex justify-between items-center">
              <h5 className="font-semibold text-center px-2">
                {highlightText(title, searchTerm)}
              </h5>
              <div className="w-4 h-5 text-sm rounded-sm text-center" style={{
                color: 'inherit',
                background: 'rgba(0,0,0,0.1)',
              }}>
                {Object.keys(tasks).length}
              </div>
            </div>
            <div
              ref={menuTriggerRef}
              className="card-option-div h-8 w-10 pr-1 flex justify-center items-center cursor-pointer opacity-0"
              onClick={() => setToggleMenu((prev) => !prev)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width="25"
                height="25"
                viewBox="0 0 30 30"
                fill="currentColor"
              >
                <path d="M 4 11 C 1.791 11 0 12.791 0 15 C 0 17.209 1.791 19 4 19 C 6.209 19 8 17.209 8 15 C 8 12.791 6.209 11 4 11 z M 15 11 C 12.791 11 11 12.791 11 15 C 11 17.209 12.791 19 15 19 C 17.209 19 19 17.209 19 15 C 19 12.791 17.209 11 15 11 z M 26 11 C 23.791 11 22 12.791 22 15 C 22 17.209 23.791 19 26 19 C 28.209 19 30 17.209 30 15 C 30 12.791 28.209 11 26 11 z"></path>
              </svg>
            </div>
          </div>
        );
      })()}
      <div className="task-list max-h-[30rem] overflow-y-auto">
        <ul>
          {Object.values(tasks).length > 0 ? (
            Object.values(tasks).map((task, taskIndex) => (
              <React.Fragment key={task.id}>
                <li
                  className={`task-item flex flex-col p-2 mt-2 shadow-sm rounded-md cursor-grab ${
                    doneTasks[task.id] ? "line-through" : ""
                  }`}
                  style={{
                    background: 'var(--theme-task-bg)',
                    border: '1px solid var(--theme-task-border)',
                  }}
                  draggable
                  onDragStart={(e) => onDragStart(e, task, index)}
                  onDragOver={onDragOver}
                  onDrop={(e) => handleDrop(e, taskIndex)}
                >
                  {editingTaskId === task.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveEditedTask(task.id, editingTaskValue);
                      }}
                      className="flex items-center w-full"
                    >
                      <input
                        type="text"
                        value={editingTaskValue}
                        onChange={handleEditChange}
                        className="w-full h-8 p-2 border-2 rounded focus:outline-none"
                        style={{
                          background: 'var(--theme-bg-input)',
                          borderColor: 'var(--theme-border)',
                          color: 'var(--theme-text-primary)',
                        }}
                        placeholder="Edit task"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="ml-2"
                        style={{ color: 'var(--theme-text-muted)' }}
                        onMouseEnter={(e) => e.target.style.color = 'var(--theme-success)'}
                        onMouseLeave={(e) => e.target.style.color = 'var(--theme-text-muted)'}
                      >
                        <i className="fa-regular fa-square-check fa-lg"></i>
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="task-container flex justify-between items-center w-full active:cursor-grabbing">
                        <p className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                          {highlightText(task.value, searchTerm)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center w-full mt-2">
                        <h4 className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                          {highlightText(task.id, searchTerm)}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              startEditingTask(task.id, task.value)
                            }
                            style={{ color: 'var(--theme-text-muted)' }}
                            title="Edit task"
                          >
                            <img
                              className="hover:scale-125 hover:duration-400 hover:ease-in-out"
                              src={pencilLogo}
                              alt="Edit"
                              style={{ filter: 'var(--theme-text-primary)' === '#1e293b' ? 'none' : 'invert(0.7)' }}
                            />
                          </button>
                          <button
                            onClick={() => toggleDoneTask(task.id)}
                            className="pr-1"
                            style={{ color: 'var(--theme-text-muted)' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--theme-success)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--theme-text-muted)'}
                            title="Mark as done"
                          >
                            <i className="fa-regular fa-check-circle"></i>
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="pr-"
                            style={{ color: 'var(--theme-text-muted)' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--theme-danger)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--theme-text-muted)'}
                            title="Delete task"
                          >
                            <i className="fa-regular fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </li>
              </React.Fragment>
            ))
          ) : (
            <li
              className="h-8 task-item flex flex-col p-2 mt-2 shadow-sm rounded-md cursor-grab opacity-15"
              style={{ background: 'var(--theme-task-bg)' }}
              onDragOver={onDragOver}
              onDrop={(e) => handleDrop(e, 0)}
            >
              Drop tasks here
            </li>
          )}
        </ul>
      </div>
      {toggleAddTask ? (
        <form onSubmit={addTask} className="w-full px-1 py-1" ref={inputRef}>
          <input
            type="text"
            value={taskValue}
            onChange={handleInputChange}
            className="w-full h-10 p-2 border-b-2 shadow-lg rounded focus:outline-none"
            style={{
              background: 'var(--theme-bg-input)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
            placeholder="Enter task"
            autoFocus
          />
        </form>
      ) : (
        <div
          onClick={toggleInput}
          className="create-task-btn m-2 flex flex-col items-start cursor-pointer rounded-lg p-2"
          style={{
            color: 'var(--theme-text-muted)',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--theme-bg-hover)';
            e.currentTarget.style.color = 'var(--theme-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--theme-text-muted)';
          }}
        >
          + Create Task
        </div>
      )}

      {showDeleteWarning && (
        <DeleteWarningModal
            index={index}
            updateCardTasks={updateCardTasks}
            setShowDeleteWarning={setShowDeleteWarning}
            toDelete={toDelete}
            updateCards={updateCards}
        />
      )}

      {defaultModal && (
          <DefaultModal
            setDefaultModal={setDefaultModal}
          />
      )}

    </div>
  );
}

export default Card;
