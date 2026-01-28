import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { analytics } from "./utils/analytics";

// Initialize PostHog
const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY;
if (POSTHOG_API_KEY) {
  // Load PostHog script dynamically
  const script = document.createElement('script');
  script.innerHTML = `
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group identifyGroup resetGroup setGroupPropertyOnce getGroupProperty getGroupProperties".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    window.posthog?.init('${POSTHOG_API_KEY}', {
      api_host: 'https://us.i.posthog.com',
      persistence: 'cookie',
      cookie_domain: '.simicodes.xyz',
      cross_subdomain_cookie: true,
      debug: ${import.meta.env.DEV}
    });
  `;
  document.head.appendChild(script);
  
  console.log('PostHog initialized with cross-subdomain tracking');
} else {
  console.warn('PostHog API key not found in environment variables');
}

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
