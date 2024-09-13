import React, { createContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const CardsContext = createContext();

const defaultCards = [
  { title: "To-do", color: "bg-gray-200", isVisible: true, tasks: {} },
  { title: "In-Progress", color: "bg-blue-100", isVisible: true, tasks: {} },
  { title: "Done", color: "bg-green-100", isVisible: true, tasks: {} },
];

export const CardsProvider = ({ children }) => {
  const initialBoards = JSON.parse(localStorage.getItem('boards')) || [{ id: uuidv4(), title: "Board 1", cards: defaultCards }];

  const [boards, setBoards] = useState(initialBoards);

  useEffect(() => {
    localStorage.setItem('boards', JSON.stringify(boards));
  }, [boards]);

  return (
    <CardsContext.Provider value={{ boards, setBoards, defaultCards }}>
      {children}
    </CardsContext.Provider>
  );
};