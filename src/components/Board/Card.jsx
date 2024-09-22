import React, { useState, useEffect, useRef } from "react";
import { generateTaskID } from "../../utils/taskIdGenerator";
import pencilLogo from "../../assets/pencil.svg";
import "./DropArea.css";

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
    updateCards((prevCards) => prevCards.filter((card, i) => i !== index));
    setToggleMenu(false);
  };

  const deleteAllTasks = () => {
    setToggleMenu(false);
    updateCardTasks(index, {});
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
        <span key={i} className="bg-yellow-200">
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
      } bg-white shadow-lg relative`}
    >
      {toggleMenu && (
        <div
          ref={menuRef}
          className="title-option-menu absolute h-auto w-32 bg-white drop-shadow-md top-6 right-2 z-30 flex flex-col items-start justify-around rounded-lg"
        >
          {title !== "To-do" && title !== "In-Progress" && title !== "Done" && (
            <>
              <p
                className="p-2 hover:bg-gray-100 w-full cursor-pointer rounded-t-lg"
                onClick={handleDeleteCard}
              >
                Delete Card
              </p>
            </>
          )}
          <p
            className="p-2 hover:bg-gray-100 hover:rounded-lg w-full cursor-pointer rounded-lg"
            onClick={deleteAllTasks}
          >
            Delete All Tasks
          </p>
        </div>
      )}
      <div
        className={`card-title ${color} flex justify-between items-center text-sm cursor-pointer`}
      >
        <div className="h-full flex justify-between items-center">
          <h5 className="font-semibold text-center px-2">
            {highlightText(title, searchTerm)}
          </h5>
          <div className="w-4 h-5 text-white text-sm bg-gray-700 bg-opacity-10 rounded-sm text-center">
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
          >
            <path d="M 4 11 C 1.791 11 0 12.791 0 15 C 0 17.209 1.791 19 4 19 C 6.209 19 8 17.209 8 15 C 8 12.791 6.209 11 4 11 z M 15 11 C 12.791 11 11 12.791 11 15 C 11 17.209 12.791 19 15 19 C 17.209 19 19 17.209 19 15 C 19 12.791 17.209 11 15 11 z M 26 11 C 23.791 11 22 12.791 22 15 C 22 17.209 23.791 19 26 19 C 28.209 19 30 17.209 30 15 C 30 12.791 28.209 11 26 11 z"></path>
          </svg>
        </div>
      </div>
      <div className="task-list max-h-[30rem] overflow-y-auto">
        <ul>
          {Object.values(tasks).length > 0 ? (
            Object.values(tasks).map((task, taskIndex) => (
              <React.Fragment key={task.id}>
                <li
                  className={`task-item flex flex-col p-2 mt-2 bg-white shadow-sm rounded-md cursor-grab ${
                    doneTasks[task.id] ? "line-through" : ""
                  }`}
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
                        className="w-full h-8 p-2 border-2 border-gray-300 bg-white rounded focus:outline-none focus:border-gray-500"
                        placeholder="Edit task"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="ml-2 text-gray-400 hover:text-green-500"
                      >
                        <i className="fa-regular fa-square-check fa-lg"></i>
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="task-container flex justify-between items-center w-full active:cursor-grabbing">
                        <p className="text-sm font-medium">
                          {highlightText(task.value, searchTerm)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center w-full mt-2">
                        <h4 className="text-xs text-gray-500">
                          {highlightText(task.id, searchTerm)}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              startEditingTask(task.id, task.value)
                            }
                            className="text-gray-400 hover:text-blue-500"
                            title="Edit task"
                          >
                            <img
                              className="hover:scale-125 hover:duration-400 hover:ease-in-out"
                              src={pencilLogo}
                              alt="Edit"
                            />
                          </button>
                          <button
                            onClick={() => toggleDoneTask(task.id)}
                            className="text-gray-400 hover:text-green-500 pr-1"
                            title="Mark as done"
                          >
                            <i className="fa-regular fa-check-circle"></i>
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-gray-400 hover:text-red-500 pr-"
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
              className="h-8 task-item flex flex-col p-2 mt-2 bg-white shadow-sm rounded-md cursor-grab opacity-15"
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
            className="w-full h-10 p-2 bg-gray-100 border-b-2 shadow-lg rounded focus:outline-none focus:border-gray-200"
            placeholder="Enter task"
            autoFocus
          />
        </form>
      ) : (
        <div
          onClick={toggleInput}
          className="create-task-btn bg-transparent m-2 flex flex-col items-start text-gray-500 cursor-pointer hover:bg-gray-100 hover:text-gray-700 rounded-lg p-2"
        >
          + Create Task
        </div>
      )}
    </div>
  );
}

export default Card;
