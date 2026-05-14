import React, { createContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const CardsContext = createContext();

export const CardsProvider = ({ children }) => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- Fetch Boards ---------------- */

  const fetchBoards = async () => {
    const { data, error } = await supabase
      .from("boards")
      .select(`
        id,
        title,
        cards (
          id,
          title,
          color,
          position,
          tasks (
            id,
            title,
            description,
            position
          )
        )
      `)
      .order("created_at", { ascending: true });

    if (!error && data) {
      const formatted = data.map((board) => ({
        id: board.id,
        title: board.title,
        cards:
          board.cards
            ?.sort((a, b) => a.position - b.position)
            .map((card) => ({
              id: card.id,
              title: card.title,
              color: card.color,
              isVisible: true,
              tasks:
                card.tasks
                  ?.sort((a, b) => a.position - b.position)
                  .reduce((acc, task) => {
                    acc[task.id] = task;
                    return acc;
                  }, {}) || {},
            })) || [],
      }));

      setBoards(formatted);
      return formatted;
    }

    return [];
  };

  /* ---------------- Create Default Board ---------------- */

  const createDefaultBoard = async (userId) => {
  const { data: board, error } = await supabase
    .from("boards")
    .insert({ title: "My First Board" })
    .select()
    .single();

  if (error || !board) {
    console.error("Board creation failed", error);
    return;
  }

  const { error: memberError } = await supabase
    .from("board_members")
    .insert({
      board_id: board.id,
      user_id: userId,
      role: "owner",
    });

  if (memberError) {
    console.error("Membership creation failed", memberError);
    return;
  }

  const defaultColumns = [
    { title: "To-do", color: "bg-gray-200", position: 0 },
    { title: "In-Progress", color: "bg-blue-100", position: 1 },
    { title: "Done", color: "bg-green-100", position: 2 },
  ];

  await supabase.from("cards").insert(
    defaultColumns.map((col) => ({
      ...col,
      board_id: board.id,
    }))
  );
};

  /* ---------------- Initial Load ---------------- */

  useEffect(() => {
  const init = async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      console.log("User logged in:", session.user.id);

      const existingBoards = await fetchBoards();
      console.log("Existing boards:", existingBoards);

      if (existingBoards.length === 0) {
        console.log("Creating default board...");
        await createDefaultBoard(session.user.id);
        const updatedBoards = await fetchBoards();
        console.log("Boards after creation:", updatedBoards);
      }
    } else {
      console.log("No session found");
      setBoards([]);
    }

    setLoading(false);
  };

  init();

  const { data: listener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user) {
        console.log("Auth state changed:", session.user.id);

        setLoading(true);

        const existingBoards = await fetchBoards();
        console.log("Existing boards (auth change):", existingBoards);

        if (existingBoards.length === 0) {
          console.log("Creating default board (auth change)...");
          await createDefaultBoard(session.user.id);
          const updatedBoards = await fetchBoards();
          console.log("Boards after creation:", updatedBoards);
        }

        setLoading(false);
      } else {
        console.log("User logged out");
        setBoards([]);
      }
    }
  );

  return () => {
    listener.subscription.unsubscribe();
  };
}, []);

  return (
    <CardsContext.Provider value={{ boards, fetchBoards, loading }}>
      {children}
    </CardsContext.Provider>
  );
};