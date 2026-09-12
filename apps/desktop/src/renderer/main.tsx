import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.js";
import { setupBrowserMockBridge } from "./mock-bridge.js";
import "./index.css";

// Setup browser mock bridge if running outside Electron context
setupBrowserMockBridge();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
