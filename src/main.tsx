import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import "./index.css";
import App from "./App.tsx";

// Uygulamayı başlatan giriş noktası.
// BrowserRouter: sayfa geçişlerini yönetir.
// AppProvider: paylaşılan durumu (giriş, kitaplar) tüm sayfalara sağlar.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>
);
