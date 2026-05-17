import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { generateTaskID } from "../../utils/taskIdGenerator";
import { renderTaskValue } from "../../utils/richText";
import { sanitizeHtml, markdownToHtml, isHtml, htmlToText } from "../../utils/htmlEditor";
import { useTheme } from "../../contexts/ThemeContext";
import {
  VscEdit, VscCheck, VscTrash, VscSave, VscCopy, VscClose,
  VscBold, VscItalic,
} from "react-icons/vsc";
import { IoDuplicateOutline } from "react-icons/io5";
import { IoImageOutline } from "react-icons/io5";
import { RiUnderline } from "react-icons/ri";
import DeleteWarningModal from "./DeleteWarningModal.jsx";
import DefaultModal from "./DefaultModal.jsx";
import ContextMenu from "../ContextMenu.jsx";
import ImageModal from "./ImageModal.jsx";
import RichEditor from "./RichEditor.jsx";

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

// Compress uploaded images to max 900px and ~80% quality
const compressImage = (file) =>
  new Promise((resolve, reject) => {
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Image must be smaller than 10 MB'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = ({ target: { result } }) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Not a valid image'));
      img.onload = () => {
        const MAX = 900;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });

// Formatting toolbar — delegates to RichEditor's exec API.
// onMouseDown preventDefault keeps the editor focused while clicking buttons.
function FormattingToolbar({ editorRef }) {
  const apply = (cmd) => editorRef.current?.exec(cmd);

  const btnStyle = {
    background: 'var(--theme-bg-hover)',
    border: '1px solid var(--theme-border)',
    borderRadius: '0.25rem',
    color: 'var(--theme-text-secondary)',
    cursor: 'pointer',
    padding: '2px 7px',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
  };

  const mod = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform) ? '⌘' : 'Ctrl';

  return (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
      <button type="button" style={btnStyle} title={`Bold (${mod}+B)`}
        onMouseDown={e => e.preventDefault()} onClick={() => apply('bold')}>
        <VscBold />
      </button>
      <button type="button" style={btnStyle} title={`Italic (${mod}+I)`}
        onMouseDown={e => e.preventDefault()} onClick={() => apply('italic')}>
        <VscItalic />
      </button>
      <button type="button" style={btnStyle} title={`Underline (${mod}+U)`}
        onMouseDown={e => e.preventDefault()} onClick={() => apply('underline')}>
        <RiUnderline />
      </button>
    </div>
  );
}

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
      style={{ ...style, transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      {...(isEditing ? {} : listeners)}
      onContextMenu={onContextMenu}
    >
      {children}
    </li>
  );
}

function Card({
  index, uid, title, color, isVisible, tasks,
  updateCardTasks, updateCards, searchTerm,
  quickAddSignal = 0, dragHandleProps = {},
}) {
  const { currentThemeId } = useTheme();
  const [isMounted, setIsMounted]             = useState(false);
  const [toggleAddTask, setToggleAddTask]     = useState(false);
  const [toggleMenu, setToggleMenu]           = useState(false);
  const [isEditingTitle, setIsEditingTitle]   = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState("");
  const [taskValue, setTaskValue]             = useState(""); // HTML string
  const [newTaskImages, setNewTaskImages]     = useState([]);
  const [editingTaskId, setEditingTaskId]     = useState(null);
  const [editingTaskValue, setEditingTaskValue]   = useState(""); // HTML string
  const [editingTaskImages, setEditingTaskImages] = useState([]);
  const [doneTasks, setDoneTasks]             = useState({});
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [toDelete, setToDelete]               = useState("");
  const [defaultModal, setDefaultModal]       = useState(false);
  const [ctxMenu, setCtxMenu]                 = useState(null);
  const [viewingImages, setViewingImages]     = useState(null); // { images, index }

  const inputRef      = useRef(null);
  const menuRef       = useRef(null);
  const menuTriggerRef = useRef(null);
  const editEditorRef = useRef(null);
  const newEditorRef  = useRef(null);
  const editFileInputRef = useRef(null);
  const newFileInputRef  = useRef(null);

  const isProtectedColumn = PROTECTED_COLUMN_TITLES.has(title);

  // ── Context menus ──────────────────────────────────────────────────────────

  const copyTaskText = async (value) => {
    try {
      const text = isHtml(value) ? htmlToText(value) : value;
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy — clipboard permission denied");
    }
  };

  const startEditingTitle = () => {
    setEditingTitleValue(title);
    setIsEditingTitle(true);
  };

  const saveCardTitle = () => {
    const trimmed = editingTitleValue.trim();
    if (trimmed && trimmed !== title) {
      updateCards(cards =>
        cards.map((c, i) => (i === index ? { ...c, title: trimmed } : c))
      );
    }
    setIsEditingTitle(false);
  };

  const cancelEditCardTitle = () => {
    setIsEditingTitle(false);
    setEditingTitleValue("");
  };

  const duplicateTask = (task) => {
    const newTask = { id: generateTaskID(title), value: task.value, images: task.images || [] };
    updateCardTasks(index, { ...tasks, [newTask.id]: newTask });
  };

  const openTaskContextMenu = (e, task) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({
      x: e.clientX, y: e.clientY,
      items: [
        { label: "Edit task",   icon: <VscEdit />,          onClick: () => startEditingTask(task.id, task.value, task.images) },
        { label: doneTasks[task.id] ? "Mark as undone" : "Mark as done", icon: <VscCheck />, onClick: () => toggleDoneTask(task.id) },
        { label: "Copy text",   icon: <VscCopy />,          onClick: () => copyTaskText(task.value) },
        { label: "Duplicate",   icon: <IoDuplicateOutline />, onClick: () => duplicateTask(task) },
        { divider: true },
        { label: "Delete task", icon: <VscTrash />, danger: true, onClick: () => deleteTask(task.id) },
      ],
    });
  };

  const openCardContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const items = [
      { label: "Rename card", icon: <VscEdit />, onClick: startEditingTitle },
      { label: "Add task",    icon: "＋",         onClick: () => setToggleAddTask(true) },
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
      x: e.clientX, y: e.clientY,
      items: [
        { label: "New task", icon: "＋", onClick: () => setToggleAddTask(true) },
        {
          label: "Paste as task",
          icon: "📋",
          onClick: async () => {
            try {
              const text = await navigator.clipboard.readText();
              if (text.trim()) {
                const newTask = { id: generateTaskID(title), value: text.trim(), images: [] };
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

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isVisible) setTimeout(() => setIsMounted(true), 10);
  }, [isVisible]);

  useEffect(() => {
    if (quickAddSignal > 0) setToggleAddTask(true);
  }, [quickAddSignal]);

  useEffect(() => {
    const handler = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) setToggleAddTask(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        menuTriggerRef.current && !menuTriggerRef.current.contains(e.target)
      ) setToggleMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Task CRUD ──────────────────────────────────────────────────────────────

  const addTask = (e) => {
    e?.preventDefault?.();
    const clean = sanitizeHtml(taskValue);
    const hasText = htmlToText(clean).length > 0;
    if (!hasText && newTaskImages.length === 0) { setToggleAddTask(false); return; }
    const newTask = { id: generateTaskID(title), value: clean, images: newTaskImages };
    updateCardTasks(index, { ...tasks, [newTask.id]: newTask });
    setTaskValue("");
    setNewTaskImages([]);
    newEditorRef.current?.setHtml('');
    newEditorRef.current?.focus();
    setToggleAddTask(true);
  };

  const deleteTask = (taskId) => {
    const updated = { ...tasks };
    delete updated[taskId];
    updateCardTasks(index, updated);
  };

  const startEditingTask = (taskId, taskVal, taskImages = []) => {
    setEditingTaskId(taskId);
    // Convert legacy markdown tasks to HTML for the rich editor
    const initialHtml = isHtml(taskVal) ? (taskVal || '') : markdownToHtml(taskVal || '');
    setEditingTaskValue(initialHtml);
    setEditingTaskImages(taskImages || []);
  };

  const saveEditedTask = (taskId) => {
    const clean = sanitizeHtml(editingTaskValue);
    updateCardTasks(index, {
      ...tasks,
      [taskId]: { ...tasks[taskId], value: clean, images: editingTaskImages },
    });
    setEditingTaskId(null);
    setEditingTaskValue("");
    setEditingTaskImages([]);
  };

  const handleDeleteCard = () => { setToggleMenu(false); setToDelete("card");  setShowDeleteWarning(true); };
  const deleteAllTasks   = () => { setToggleMenu(false); setToDelete("tasks"); Object.keys(tasks).length > 0 ? setShowDeleteWarning(true) : setDefaultModal(true); };
  const toggleDoneTask   = (taskId) => setDoneTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));

  // ── Image upload ───────────────────────────────────────────────────────────

  const processUpload = async (files) => {
    const results = await Promise.allSettled(files.map(compressImage));
    const b64s = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') b64s.push(r.value);
      else toast.error(`${files[i].name}: ${r.reason.message}`);
    });
    return b64s;
  };

  const handleEditUpload = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    const b64s = await processUpload(files);
    if (b64s.length) setEditingTaskImages(prev => [...prev, ...b64s]);
    // Return focus to the editor so Enter saves the task
    editEditorRef.current?.focus();
  };

  const handleNewUpload = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    const b64s = await processUpload(files);
    if (b64s.length) setNewTaskImages(prev => [...prev, ...b64s]);
    newEditorRef.current?.focus();
  };

  const removeEditingImage = (i) =>
    setEditingTaskImages(prev => prev.filter((_, idx) => idx !== i));

  const removeNewImage = (i) =>
    setNewTaskImages(prev => prev.filter((_, idx) => idx !== i));

  // ── Computed ───────────────────────────────────────────────────────────────

  const isDark = ['dark', 'midnight', 'forest', 'sunset'].includes(currentThemeId);
  const palette = isDark ? CARD_COLORS.dark : CARD_COLORS.light;
  const cardColor = palette[color] || { bg: 'var(--theme-accent)', text: '#fff' };

  // ── Shared styles ──────────────────────────────────────────────────────────

  const thumbStyle = (clickable) => ({
    width: '48px', height: '48px', objectFit: 'cover',
    borderRadius: '4px', border: '1px solid var(--theme-border)',
    cursor: clickable ? 'pointer' : 'default',
    flexShrink: 0,
  });

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
          <p className="p-2 w-full cursor-pointer rounded-t-lg text-sm"
            style={{ color: 'var(--theme-text-primary)' }}
            onMouseEnter={e => e.target.style.background = 'var(--theme-bg-hover)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}
            onClick={() => { setToggleMenu(false); startEditingTitle(); }}>
            Rename Card
          </p>
          {!isProtectedColumn && (
            <p className="p-2 w-full cursor-pointer text-sm"
              style={{ color: 'var(--theme-text-primary)' }}
              onMouseEnter={e => e.target.style.background = 'var(--theme-bg-hover)'}
              onMouseLeave={e => e.target.style.background = 'transparent'}
              onClick={handleDeleteCard}>
              Delete Card
            </p>
          )}
          <p className="p-2 w-full cursor-pointer rounded-b-lg text-sm"
            style={{ color: 'var(--theme-text-primary)' }}
            onMouseEnter={e => e.target.style.background = 'var(--theme-bg-hover)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}
            onClick={deleteAllTasks}>
            Delete All Tasks
          </p>
        </div>
      )}

      {/* Card header — drag handle */}
      <div
        className="card-title flex justify-between items-center text-sm"
        style={{ backgroundColor: cardColor.bg, color: cardColor.text, cursor: 'grab' }}
        onContextMenu={openCardContextMenu}
        {...dragHandleProps}
      >
        <div className="h-full flex justify-between items-center">
          {isEditingTitle ? (
            <input
              type="text"
              value={editingTitleValue}
              onChange={e => setEditingTitleValue(e.target.value)}
              onBlur={saveCardTitle}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
                if (e.key === 'Escape') { e.preventDefault(); cancelEditCardTitle(); }
              }}
              onClick={e => e.stopPropagation()}
              onPointerDown={e => e.stopPropagation()}
              className="font-semibold px-2 bg-transparent border-b focus:outline-none"
              style={{
                color: cardColor.text,
                borderColor: 'rgba(0,0,0,0.4)',
                width: `${Math.max(editingTitleValue.length + 2, 6)}ch`,
                minWidth: '4rem',
                maxWidth: '14rem',
              }}
              autoFocus
              onFocus={e => e.target.select()}
            />
          ) : (
            <h5
              className="font-semibold text-center px-2 select-none"
              style={{ cursor: 'text' }}
              onDoubleClick={e => { e.stopPropagation(); startEditingTitle(); }}
              onPointerDown={e => e.stopPropagation()}
              title="Double-click to rename"
            >
              {renderTaskValue(title, searchTerm)}
            </h5>
          )}
          <div className="w-4 h-5 text-sm rounded-sm text-center"
            style={{ color: 'inherit', background: 'rgba(0,0,0,0.1)' }}>
            {Object.keys(tasks).length}
          </div>
        </div>
        <div
          ref={menuTriggerRef}
          className="card-option-div h-8 w-10 pr-1 flex justify-center items-center cursor-pointer opacity-0"
          onClick={e => { e.stopPropagation(); setToggleMenu(prev => !prev); }}
          onPointerDown={e => e.stopPropagation()}
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
                  onContextMenu={e => openTaskContextMenu(e, task)}
                >
                  {editingTaskId === task.id ? (
                    /* ── Edit mode ── */
                    <form
                      onSubmit={e => { e.preventDefault(); saveEditedTask(task.id); }}
                      className="flex flex-col w-full gap-1"
                    >
                      <FormattingToolbar editorRef={editEditorRef} />
                      <div className="flex items-start gap-2">
                        <RichEditor
                          ref={editEditorRef}
                          initialHtml={editingTaskValue}
                          onChange={setEditingTaskValue}
                          onSave={() => saveEditedTask(task.id)}
                          onCancel={() => { setEditingTaskId(null); setEditingTaskValue(''); setEditingTaskImages([]); }}
                          autoFocus
                          placeholder="Edit task (Shift+Enter for newline)"
                          className="flex-1 p-2 border-2 rounded text-sm"
                          style={{
                            background: 'var(--theme-bg-input)',
                            borderColor: 'var(--theme-border)',
                            color: 'var(--theme-text-primary)',
                            minHeight: '4rem',
                            fontFamily: 'inherit',
                          }}
                        />
                        <button
                          type="submit"
                          className="mt-1 text-lg"
                          style={{ color: 'var(--theme-text-muted)' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--theme-success)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--theme-text-muted)'}
                          title="Save (Enter)"
                          onPointerDown={e => e.stopPropagation()}
                        >
                          <VscSave />
                        </button>
                      </div>

                      {/* Image thumbnails in edit mode */}
                      {editingTaskImages.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                          {editingTaskImages.map((src, i) => (
                            <div key={i} style={{ position: 'relative' }}>
                              <img src={src} alt={`img-${i}`} style={thumbStyle(false)} />
                              <button
                                type="button"
                                onClick={() => removeEditingImage(i)}
                                onPointerDown={e => e.stopPropagation()}
                                style={{
                                  position: 'absolute', top: '-6px', right: '-6px',
                                  background: 'var(--theme-danger)',
                                  border: 'none', borderRadius: '50%',
                                  color: 'white', width: '16px', height: '16px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', fontSize: '10px', padding: 0,
                                }}
                              >
                                <VscClose />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload button */}
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        onPointerDown={e => e.stopPropagation()}
                        style={{
                          alignSelf: 'flex-start',
                          display: 'flex', alignItems: 'center', gap: '4px',
                          background: 'none', border: '1px dashed var(--theme-border)',
                          borderRadius: '0.25rem', color: 'var(--theme-text-muted)',
                          fontSize: '0.75rem', padding: '3px 8px', cursor: 'pointer',
                          marginTop: '2px',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--theme-text-primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--theme-text-muted)'}
                      >
                        <IoImageOutline /> Add image
                      </button>
                    </form>
                  ) : (
                    /* ── Display mode ── */
                    <>
                      <div
                        className="task-container flex justify-between items-start w-full"
                        onDoubleClick={() => startEditingTask(task.id, task.value, task.images)}
                        title="Double-click to edit"
                        style={{ cursor: 'text' }}
                        onPointerDown={e => e.stopPropagation()}
                      >
                        <div
                          className="text-sm font-medium flex-1"
                          style={{ color: 'var(--theme-text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                        >
                          {renderTaskValue(task.value, searchTerm)}
                        </div>
                      </div>

                      {/* Image thumbnails in display mode */}
                      {task.images?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px', justifyContent: 'flex-start' }}>
                          {task.images.map((src, i) => (
                            <img
                              key={i}
                              src={src}
                              alt={`attachment-${i}`}
                              style={thumbStyle(true)}
                              onClick={e => { e.stopPropagation(); setViewingImages({ images: task.images, index: i }); }}
                              onPointerDown={e => e.stopPropagation()}
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between items-center w-full mt-2">
                        <h4 className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                          {renderTaskValue(task.id, searchTerm)}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startEditingTask(task.id, task.value, task.images)}
                            style={{ color: 'var(--theme-text-muted)' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--theme-accent)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--theme-text-muted)'}
                            title="Edit task"
                            onPointerDown={e => e.stopPropagation()}
                          >
                            <VscEdit className="text-base" />
                          </button>
                          <button
                            onClick={() => toggleDoneTask(task.id)}
                            className="pr-1"
                            style={{ color: 'var(--theme-text-muted)' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--theme-success)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--theme-text-muted)'}
                            title="Mark as done"
                            onPointerDown={e => e.stopPropagation()}
                          >
                            <VscCheck className="text-base" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            style={{ color: 'var(--theme-text-muted)' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--theme-danger)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--theme-text-muted)'}
                            title="Delete task"
                            onPointerDown={e => e.stopPropagation()}
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
              <li className="h-8 task-item flex items-center p-2 mt-2 shadow-sm rounded-md opacity-15"
                style={{ background: 'var(--theme-task-bg)' }}>
                Drop tasks here
              </li>
            )}
          </ul>
        </SortableContext>
      </div>

      {/* Add task area */}
      {toggleAddTask ? (
        <form onSubmit={addTask} className="w-full px-1 py-1 flex flex-col gap-1" ref={inputRef}>
          <FormattingToolbar editorRef={newEditorRef} />
          <RichEditor
            ref={newEditorRef}
            initialHtml=""
            onChange={setTaskValue}
            onSave={() => addTask()}
            onCancel={() => { setToggleAddTask(false); setTaskValue(''); setNewTaskImages([]); }}
            autoFocus
            placeholder="Enter task (Shift+Enter for newline)"
            className="w-full p-2 border-b-2 shadow-lg rounded text-sm"
            style={{
              background: 'var(--theme-bg-input)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
              minHeight: '3rem',
              fontFamily: 'inherit',
            }}
          />

          {/* New task: image thumbnails */}
          {newTaskImages.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px', justifyContent: 'flex-start' }}>
              {newTaskImages.map((src, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={src} alt={`new-img-${i}`} style={thumbStyle(false)} />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    onPointerDown={e => e.stopPropagation()}
                    style={{
                      position: 'absolute', top: '-6px', right: '-6px',
                      background: 'var(--theme-danger)',
                      border: 'none', borderRadius: '50%',
                      color: 'white', width: '16px', height: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', fontSize: '10px', padding: 0,
                    }}
                  >
                    <VscClose />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New task: upload + save */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
            <button
              type="button"
              onClick={() => newFileInputRef.current?.click()}
              onPointerDown={e => e.stopPropagation()}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'none', border: '1px dashed var(--theme-border)',
                borderRadius: '0.25rem', color: 'var(--theme-text-muted)',
                fontSize: '0.75rem', padding: '3px 8px', cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--theme-text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--theme-text-muted)'}
            >
              <IoImageOutline /> Add image
            </button>
            <button
              type="submit"
              onPointerDown={e => e.stopPropagation()}
              style={{
                marginLeft: 'auto',
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'var(--theme-accent)', border: 'none',
                borderRadius: '0.25rem', color: 'white',
                fontSize: '0.75rem', padding: '4px 10px', cursor: 'pointer',
              }}
              title="Save task (Enter)"
            >
              <VscSave /> Save
            </button>
          </div>
        </form>
      ) : (
        <div
          onClick={() => setToggleAddTask(prev => !prev)}
          onContextMenu={openCreateTaskContextMenu}
          className="create-task-btn m-2 flex flex-col items-start cursor-pointer rounded-lg p-2"
          style={{ color: 'var(--theme-text-muted)', background: 'transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-bg-hover)'; e.currentTarget.style.color = 'var(--theme-text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--theme-text-muted)'; }}
        >
          + Create Task
        </div>
      )}

      {/* Hidden file inputs for image upload */}
      <input
        ref={editFileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleEditUpload}
      />
      <input
        ref={newFileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleNewUpload}
      />

      {showDeleteWarning && (
        <DeleteWarningModal
          index={index}
          updateCardTasks={updateCardTasks}
          setShowDeleteWarning={setShowDeleteWarning}
          toDelete={toDelete}
          updateCards={updateCards}
        />
      )}

      {defaultModal && <DefaultModal setDefaultModal={setDefaultModal} />}

      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={() => setCtxMenu(null)} />
      )}

      {viewingImages && createPortal(
        <ImageModal
          images={viewingImages.images}
          initialIndex={viewingImages.index}
          onClose={() => setViewingImages(null)}
        />,
        document.body
      )}
    </div>
  );
}

export default Card;
