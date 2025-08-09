import * as auth from "../services/auth.js";
import { showError, showSuccess, clearErrors } from "../utils/msg.js";

let form, submitBtn;

function init() {
  if (!auth.requireAuth()) return;
  form = document.getElementById("resetForm");
  submitBtn = document.getElementById("resetButton");

  setupUpdateListeners();
  setLoading(false);
}

function setupUpdateListeners() {
  form.addEventListener("submit", handleUpdateSubmit);

  const inputs = form.querySelectorAll(".form-input");
  inputs.forEach((input) => {
    input.addEventListener("input", clearErrors);
  });
}

async function handleUpdateSubmit(e) {
  e.preventDefault();

  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    showError("Please fill in all fields");
    return;
  }

  if (newPassword.length < 8) {
    showError("New password must be at least 8 characters long");
    return;
  }

  if (newPassword !== confirmPassword) {
    showError("New passwords do not match");
    return;
  }

  setLoading(true);

  try {
    const result = await auth.updatePassword(
      currentPassword,
      newPassword,
      confirmPassword
    );
    if (result.success) {
      showSuccess("Password updated successfully!");
      form.reset();
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
  submitBtn.innerHTML = isLoading
    ? `<div class="button-loader"></div><span class="button-text">Updating...</span>`
    : `<div class="button-loader"></div><span class="button-text">Update Password</span>`;
}

document.addEventListener("DOMContentLoaded", init);
