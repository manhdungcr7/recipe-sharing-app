import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Kiểm tra lỗi
try {
  const rootElement = document.getElementById("root");
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("React rendering error:", error);
  // Hiển thị thông báo lỗi trên giao diện
  document.getElementById("root").innerHTML = `
    <div style="color: red; margin: 20px;">
      <h2>Error initializing app</h2>
      <p>${error.message}</p>
      <p>Please check the console for more details.</p>
    </div>
  `;
}