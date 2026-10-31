import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { App } from "./App.jsx";
import { ToastProvider } from "./components/Toast.jsx";

import "./theme.css";
import "./components/components.css";
import "./components/charts/charts.css";
import "./layout/layout.css";
import "./pages/pages.css";
import "./motion.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  </React.StrictMode>
);
