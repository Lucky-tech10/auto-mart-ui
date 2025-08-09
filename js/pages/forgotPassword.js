import * as auth from "../services/auth.js";
import { showError, showSuccess, clearErrors } from "../utils/msg.js";

let form, submitBtn;

function initForgotPasswordPage() {
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

  const emailInput = document.getElementById("email");
  emailInput.addEventListener("input", clearErrors);
}

async function handleSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();

  if (!email) {
    showError("Please enter your email address");
    return;
  }

  if (!isValidEmail(email)) {
    showError("Please enter a valid email address");
    return;
  }

  setLoading(true);

  try {
    const result = await auth.forgotPassword(email);
    if (result.success) {
      showSuccess(
        "Password reset link sent to your email. Check your inbox and spam folder."
      );
    }
  } catch {
    showError("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "Sending..." : "Get Reset Password Link";
}

document.addEventListener("DOMContentLoaded", initForgotPasswordPage);
