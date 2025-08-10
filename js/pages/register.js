import * as auth from "../services/auth.js";
import { showError, showSuccess, clearErrors } from "../utils/msg.js";

let form, submitBtn;

function init() {
  setupElements();
  setupEventListeners();
}

function setupElements() {
  form = document.querySelector("form");
  submitBtn = document.querySelector(".submit-btn");
}

function setupEventListeners() {
  form.addEventListener("submit", handleSubmit);

  // Clear error on input
  const inputs = form.querySelectorAll(".form-input");
  inputs.forEach((input) => {
    input.addEventListener("input", clearErrors);
  });
}

async function handleSubmit(e) {
  e.preventDefault();

  const formData = new FormData(form);
  const userData = {
    first_name:
      formData.get("first_name") || document.getElementById("first_name").value,
    last_name:
      formData.get("last_name") || document.getElementById("last_name").value,
    email: formData.get("email") || document.getElementById("email").value,
    password:
      formData.get("password") || document.getElementById("password").value,
    address:
      formData.get("address") || document.getElementById("address").value,
  };

  // Basic validation
  if (Object.values(userData).some((val) => !val)) {
    showError("Please fill in all fields");
    return;
  }

  if (userData.password.length < 8) {
    showError("Password must be at least 8 characters long");
    return;
  }

  setLoading(true);

  try {
    const result = await auth.register(userData);

    if (result.success) {
      showSuccess("Registration successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } else {
      showError(result.error);
    }
  } catch (error) {
    showError("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading
    ? "Creating Account..."
    : "Create new account";
  submitBtn.style.opacity = isLoading ? "0.7" : "1";
}

// Initialize
document.addEventListener("DOMContentLoaded", init);
