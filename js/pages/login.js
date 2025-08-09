import * as auth from "../services/auth.js";
import { showError, showSuccess, clearErrors } from "../utils/msg.js";

// Page elements
let form, submitBtn;

// Initialize page
function init() {
  // Redirect if already logged in
  if (auth.isLoggedIn()) {
    window.location.href = "/index.html";
    return;
  }

  setupElements();
  setupEventListeners();
}

function setupElements() {
  form = document.querySelector("form");
  submitBtn = document.querySelector(".submit-btn");
}

function setupEventListeners() {
  form.addEventListener("submit", handleSubmit);

  // Clear errors on input
  const inputs = form.querySelectorAll(".form-input");
  inputs.forEach((input) => {
    input.addEventListener("input", clearErrors);
  });
}

async function handleSubmit(e) {
  e.preventDefault();

  const formData = new FormData(form);
  const email = formData.get("email") || document.getElementById("email").value;
  const password =
    formData.get("password") || document.getElementById("password").value;

  if (!email || !password) {
    showError("Please fill in all fields");
    return;
  }

  setLoading(true);

  try {
    const result = await auth.login(email, password);

    if (result.success) {
      showSuccess("Login successful! Redirecting...");

      setTimeout(() => {
        const previousPage = document.referrer;

        // Avoid redirecting to login page or same page
        const isSamePage =
          !previousPage ||
          previousPage === window.location.href ||
          previousPage.includes("login.html");

        window.location.href = isSamePage ? "/index.html" : previousPage;
      }, 1500);
    } else {
      showError(result.error || "Invalid credentials.");
    }
  } catch (error) {
    showError("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "Signing In..." : "LogIn";
  submitBtn.style.opacity = isLoading ? "0.7" : "1";
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
