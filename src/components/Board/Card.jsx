import { useState, useEffect, useRef } from "react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { generateTaskID } from "../../utils/taskIdGenerator";
import { useTheme } from "../../contexts/ThemeContext";
import {
  VscEdit,
  VscCheck,
  VscTrash,
  VscSave,
  VscCopy
} from "react-icons/vsc";
import { IoDuplicateOutline } from "react-icons/io5";
import DeleteWarningModal from "./DeleteWarningModal.jsx";
import DefaultModal from "./DefaultModal.jsx";
import ContextMenu from "../ContextMenu.jsx";

const PROTECTED_COLUMN_TITLES = new Set(["To-do", "In-Progress", "Done"]);

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

// Sortable wrapper for individual task rows
function SortableTask({ task, cardUid, isEditing, className, style, onContextMenu, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task, cardUid },
    disabled: isEditing,
  });

  return (
    <li
      ref={setNodeRef}
      className={className}
      style={{
        ...style,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
      {...(isEditing ? {} : listeners)}
      onContextMenu={onContextMenu}
    >
      {children}
    </li>
  );
}

function Card({
  index,
  uid,
  title,
  color,
  isVisible,
  tasks,
  updateCardTasks,
  updateCards,
  searchTerm,
  quickAddSignal = 0,
  dragHandleProps = {},
}) {
  const { currentThemeId } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [toggleAddTask, setToggleAddTask] = useState(false);
  const [toggleMenu, setToggleMenu] = useState(false);
  const [taskValue, setTaskValue] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskValue, setEditingTaskValue] = useState("");
  const [doneTasks, setDoneTasks] = useState({});
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [toDelete, setToDelete] = useState("");
  const [defaultModal, setDefaultModal] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);

  const isProtectedColumn = PROTECTED_COLUMN_TITLES.has(title);

  const copyTaskText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy — clipboard permission denied");
    }
  };

  const duplicateTask = (task) => {
    const newTask = { id: generateTaskID(title), value: task.value };
    updateCardTasks(index, { ...tasks, [newTask.id]: newTask });
  };

  const openTaskContextMenu = (e, task) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: "Edit task", icon: <VscEdit />, onClick: () => startEditingTask(task.id, task.value) },
        { label: doneTasks[task.id] ? "Mark as undone" : "Mark as done", icon: <VscCheck />, onClick: () => toggleDoneTask(task.id) },
        { label: "Copy text", icon: <VscCopy />, onClick: () => copyTaskText(task.value) },
        { label: "Duplicate task", icon: <IoDuplicateOutline />, onClick: () => duplicateTask(task) },
        { divider: true },
        { label: "Delete task", icon: <VscTrash />, danger: true, onClick: () => deleteTask(task.id) },
      ],
    });
  };

  const openCardContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const items = [
      { label: "Add task", icon: "＋", onClick: () => setToggleAddTask(true) },
      { divider: true },
      { label: "Delete all tasks", icon: <VscTrash />, danger: true, onClick: deleteAllTasks },
    ];
    if (!isProtectedColumn) {
      items.push({ label: "Delete card", icon: <VscTrash />, danger: true, onClick: handleDeleteCard });
    }
    setCtxMenu({ x: e.clientX, y: e.clientY, items });
  };

  const openCreateTaskContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: "New task", icon: "＋", onClick: () => setToggleAddTask(true) },
        {
          label: "Paste as task",
          icon: "📋",
          onClick: async () => {
            try {
              const text = await navigator.clipboard.readText();
              if (text.trim()) {
                const newTask = { id: generateTaskID(title), value: text.trim() };
                updateCardTasks(index, { ...tasks, [newTask.id]: newTask });
                toast.success("Task created from clipboard");
              } else {
                toast.warning("Clipboard is empty");
              }
            } catch {
              toast.error("Clipboard access denied");
            }
          },
        },
      ],
    });
  };

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => setIsMounted(true), 10);
    }
  }, [isVisible]);

  useEffect(() => {
    if (quickAddSignal > 0) {
      setToggleAddTask(true);
    }
  }, [quickAddSignal]);

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
  }, []);

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

  const toggleInput = () => setToggleAddTask((prev) => !prev);

  const handleInputChange = (e) => setTaskValue(e.target.value);
  const handleEditChange = (e) => setEditingTaskValue(e.target.value);

  const addTask = (e) => {
    e.preventDefault();
    if (taskValue.trim() === "") {
      setToggleAddTask((prev) => !prev);
      return;
    }
    const newTask = { id: generateTaskID(title), value: taskValue };
    updateCardTasks(index, { ...tasks, [newTask.id]: newTask });
    setTaskValue("");
    setToggleAddTask(true);
  };

  const deleteTask = (taskId) => {
    const updatedTasks = { ...tasks };
    delete updatedTasks[taskId];
    updateCardTasks(index, updatedTasks);
  };

  const startEditingTask = (taskId, taskVal) => {
    setEditingTaskId(taskId);
    setEditingTaskValue(taskVal);
  };

  const saveEditedTask = (taskId, newContent) => {
    updateCardTasks(index, {
      ...tasks,
      [taskId]: { ...tasks[taskId], value: newContent },
    });
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

  const toggleDoneTask = (taskId) => {
    setDoneTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const URL_REGEX = /(https?:\/\/[^\s]+)/g;
  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const renderTaskText = (text, term) => {
    if (!text) return null;
    const urlSegments = text.split(URL_REGEX);
    return urlSegments.map((seg, i) => {
      if (i % 2 === 1) {
        return (
          <a
            key={`u-${i}`}
            href={seg}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            draggable={false}
            style={{ color: 'var(--theme-accent)', textDecoration: 'underline', wordBreak: 'break-all' }}
          >
            {seg}
          </a>
        );
      }
      if (!term?.trim()) return seg;
      const parts = seg.split(new RegExp(`(${escapeRegex(term)})`, "gi"));
      return parts.map((part, j) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <span
            key={`h-${i}-${j}`}
            style={{ background: 'var(--theme-highlight-bg)', borderRadius: '2px', padding: '0 2px' }}
          >
            {part}
          </span>
        ) : (
          part
        )
      );
    });
  };

  const highlightText = (text, term) => renderTaskText(text, term);

  const isDark = ['dark', 'midnight', 'forest', 'sunset'].includes(currentThemeId);
  const palette = isDark ? CARD_COLORS.dark : CARD_COLORS.light;
  const cardColor = palette[color] || { bg: 'var(--theme-accent)', text: '#fff' };

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
          {!isProtectedColumn && (
            <p
              className="p-2 w-full cursor-pointer rounded-t-lg text-sm"
              style={{ color: 'var(--theme-text-primary)' }}
              onMouseEnter={(e) => e.target.style.background = 'var(--theme-bg-hover)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
              onClick={handleDeleteCard}
            >
              Delete Card
            </p>
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

      {/* Card title — also the drag handle for column reordering */}
      <div
        className="card-title flex justify-between items-center text-sm"
        style={{ backgroundColor: cardColor.bg, color: cardColor.text, cursor: 'grab' }}
        onContextMenu={openCardContextMenu}
        {...dragHandleProps}
      >
        <div className="h-full flex justify-between items-center">
          <h5 className="font-semibold text-center px-2">
            {highlightText(title, searchTerm)}
          </h5>
          <div className="w-4 h-5 text-sm rounded-sm text-center" style={{ color: 'inherit', background: 'rgba(0,0,0,0.1)' }}>
            {Object.keys(tasks).length}
          </div>
        </div>
        <div
          ref={menuTriggerRef}
          className="card-option-div h-8 w-10 pr-1 flex justify-center items-center cursor-pointer opacity-0"
          onClick={(e) => { e.stopPropagation(); setToggleMenu((prev) => !prev); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 30 30" fill="currentColor">
            <path d="M 4 11 C 1.791 11 0 12.791 0 15 C 0 17.209 1.791 19 4 19 C 6.209 19 8 17.209 8 15 C 8 12.791 6.209 11 4 11 z M 15 11 C 12.791 11 11 12.791 11 15 C 11 17.209 12.791 19 15 19 C 17.209 19 19 17.209 19 15 C 19 12.791 17.209 11 15 11 z M 26 11 C 23.791 11 22 12.791 22 15 C 22 17.209 23.791 19 26 19 C 28.209 19 30 17.209 30 15 C 30 12.791 28.209 11 26 11 z" />
          </svg>
        </div>
      </div>

      {/* Task list */}
      <div className="task-list max-h-[30rem] overflow-y-auto">
        <SortableContext items={Object.keys(tasks)} strategy={verticalListSortingStrategy}>
          <ul>
            {Object.values(tasks).length > 0 ? (
              Object.values(tasks).map((task) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  cardUid={uid}
                  isEditing={editingTaskId === task.id}
                  className={`task-item flex flex-col p-2 mt-2 shadow-sm rounded-md ${
                    doneTasks[task.id] ? "opacity-60" : ""
                  } ${editingTaskId === task.id ? "" : "cursor-grab active:cursor-grabbing"}`}
                  style={{
                    background: 'var(--theme-task-bg)',
                    border: '1px solid var(--theme-task-border)',
                    textDecoration: doneTasks[task.id] ? 'line-through' : 'none',
                  }}
                  onContextMenu={(e) => openTaskContextMenu(e, task)}
                >
                  {editingTaskId === task.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveEditedTask(task.id, editingTaskValue);
                      }}
                      className="flex items-start w-full gap-2"
                    >
                      <textarea
                        value={editingTaskValue}
                        onChange={handleEditChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            saveEditedTask(task.id, editingTaskValue);
                          } else if (e.key === 'Escape') {
                            setEditingTaskId(null);
                            setEditingTaskValue('');
                          }
                        }}
                        className="flex-1 p-2 border-2 rounded focus:outline-none resize-y text-sm"
                        style={{
                          background: 'var(--theme-bg-input)',
                          borderColor: 'var(--theme-border)',
                          color: 'var(--theme-text-primary)',
                          minHeight: '4rem',
                          fontFamily: 'inherit',
                        }}
                        placeholder="Edit task (Shift+Enter for newline)"
                        autoFocus
                        rows={3}
                      />
                      <button
                        type="submit"
                        className="mt-1 text-lg"
                        style={{ color: 'var(--theme-text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--theme-success)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--theme-text-muted)'}
                        title="Save (Enter)"
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <VscSave />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="task-container flex justify-between items-center w-full">
                        <p
                          className="text-sm font-medium"
                          style={{ color: 'var(--theme-text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                        >
                          {renderTaskText(task.value, searchTerm)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center w-full mt-2">
                        <h4 className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                          {highlightText(task.id, searchTerm)}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startEditingTask(task.id, task.value)}
                            style={{ color: 'var(--theme-text-muted)' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--theme-accent)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--theme-text-muted)'}
                            title="Edit task"
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <VscEdit className="text-base" />
                          </button>
                          <button
                            onClick={() => toggleDoneTask(task.id)}
                            className="pr-1"
                            style={{ color: 'var(--theme-text-muted)' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--theme-success)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--theme-text-muted)'}
                            title="Mark as done"
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <VscCheck className="text-base" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            style={{ color: 'var(--theme-text-muted)' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--theme-danger)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--theme-text-muted)'}
                            title="Delete task"
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <VscTrash className="text-base" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </SortableTask>
              ))
            ) : (
              <li
                className="h-8 task-item flex items-center p-2 mt-2 shadow-sm rounded-md opacity-15"
                style={{ background: 'var(--theme-task-bg)' }}
              >
                Drop tasks here
              </li>
            )}
          </ul>
        </SortableContext>
      </div>

      {/* Add task area */}
      {toggleAddTask ? (
        <form onSubmit={addTask} className="w-full px-1 py-1" ref={inputRef}>
          <textarea
            value={taskValue}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                addTask(e);
              } else if (e.key === 'Escape') {
                setToggleAddTask(false);
                setTaskValue('');
              }
            }}
            className="w-full p-2 border-b-2 shadow-lg rounded focus:outline-none resize-y text-sm"
            style={{
              background: 'var(--theme-bg-input)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
              minHeight: '3rem',
              fontFamily: 'inherit',
            }}
            placeholder="Enter task (Shift+Enter for newline)"
            autoFocus
            rows={2}
          />
        </form>
      ) : (
        <div
          onClick={toggleInput}
          onContextMenu={openCreateTaskContextMenu}
          className="create-task-btn m-2 flex flex-col items-start cursor-pointer rounded-lg p-2"
          style={{ color: 'var(--theme-text-muted)', background: 'transparent' }}
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
        <DefaultModal setDefaultModal={setDefaultModal} />
      )}

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxMenu.items}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}

export default Card;
