// main.js
import { DynamicHeader } from "./header.js";

// Accepts optional callback for page-specific setup
export function initApp(callback = null) {
  // Check if DOM is already loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initializeHeader(callback);
    });
  } else {
    // DOM is already loaded
    initializeHeader(callback);
  }
}

function initializeHeader(callback) {
  console.log("Header initialized on page:", window.location.pathname);

  // Check if header already exists to prevent duplicate initialization
  if (window.headerManager) {
    console.log("Header already initialized");
    if (typeof callback === "function") {
      callback(window.headerManager);
    }
    return;
  }

  const header = new DynamicHeader();
  window.headerManager = header;

  if (typeof callback === "function") {
    callback(header); // Call the callback with the header instance
  }
}
