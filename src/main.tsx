import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./theme/fonts";
import { App } from "./App";
import { getConsent } from "./config/consent";
import { applyConsentedTracking } from "./config/tracking";
import { resolveTrackingIds } from "./config/trackingEvents";

applyConsentedTracking(resolveTrackingIds(), getConsent());

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element with id 'root' was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
