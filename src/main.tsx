import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Theme initialization script
const theme = localStorage.getItem('stickee-theme') || 'light';
if (theme === 'dark') {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById("root")!).render(<App />);
