import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { analytics, AnalyticsEvents } from "./utils/analytics";

console.log("Main.tsx loading...");

// Theme initialization script
const theme = localStorage.getItem('stickee-theme') || 'light';
if (theme === 'dark') {
  document.documentElement.classList.add('dark');
}

// Initialize PostHog page tracking
if (analytics.isReady()) {
  analytics.page('Stickee App');
  console.log("PostHog initialized successfully");
} else {
  console.log("PostHog not available");
}

const rootElement = document.getElementById("root");
console.log("Root element:", rootElement);

if (rootElement) {
  const root = createRoot(rootElement);
  console.log("Creating root and rendering App...");
  root.render(<App />);
} else {
  console.error("Root element not found!");
}
