import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { CardsProvider } from "./contexts/CardsContext.jsx";

createRoot(document.getElementById("root")).render(
  <CardsProvider>
      <App />
  </CardsProvider>
);
