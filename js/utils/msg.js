export function showToast(message, type = "error", duration = 3000) {
  let existing = document.querySelector(".toast-message");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast-message toast-${type}`;
  toast.textContent = message;

  // Base styles
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: opacity 0.3s ease-in-out;
    opacity: 0;
  `;

  // Color by type
  if (type === "error") {
    toast.style.background = "#e53e3e"; // red
  } else if (type === "success") {
    toast.style.background = "#38a169"; // green
  } else {
    toast.style.background = "#4a5568"; // gray
  }

  // Insert + animate
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "1";
  }, 50);

  // Auto-hide
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

export function showError(message) {
  showToast(message, "error");
}

export function showSuccess(message) {
  showToast(message, "success");
}

export function clearErrors() {
  const toast = document.querySelector(".toast-message");
  if (toast) {
    toast.remove();
  }
}
