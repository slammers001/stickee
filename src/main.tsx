import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { analytics } from "./utils/analytics";

// Theme initialization script
const theme = localStorage.getItem('stickee-theme') || 'light';
if (theme === 'dark') {
  document.documentElement.classList.add('dark');
}

// Initialize PostHog page tracking
if (analytics.isReady()) {
  analytics.page('Stickee App');
} else {
  console.log("PostHog not available");
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
