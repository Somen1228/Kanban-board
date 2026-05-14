import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { CardsProvider } from "./contexts/CardsContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CardsProvider>
          <App />
        </CardsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
