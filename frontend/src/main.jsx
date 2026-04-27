import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root div not found in index.html");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);