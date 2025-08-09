import * as auth from "../services/auth.js";
import { showError, showSuccess, clearErrors } from "../utils/msg.js";

let form, submitBtn, token, email;

function init() {
  const urlParams = new URLSearchParams(window.location.search);
  token = urlParams.get("token");
  email = urlParams.get("email");

  if (!token || !email) {
    showError("Invalid or expired reset link");
    return;
  }

  setupResetElements();
  setupResetListeners();
}

function setupResetElements() {
  form = document.querySelector("form");
  submitBtn = document.querySelector(".submit-btn");
}

function setupResetListeners() {
  form.addEventListener("submit", handleResetSubmit);
  document
    .getElementById("new_password")
    .addEventListener("input", clearErrors);
}

async function handleResetSubmit(e) {
  e.preventDefault();
  const newPassword = document.getElementById("new_password").value;

  if (!newPassword) {
    showError("Please enter a new password");
    return;
  }

  if (newPassword.length < 8) {
    showError("Password must be at least 8 characters long");
    return;
  }

  setLoading(true);

  try {
    const result = await auth.resetPassword(token, email, newPassword);
    if (result.success) {
      showSuccess("Password reset successful! Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } else {
      showError(result.error);
    }
  } catch {
    showError("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "Resetting..." : "Reset Password";
}

document.addEventListener("DOMContentLoaded", init);
