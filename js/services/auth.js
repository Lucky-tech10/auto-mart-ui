import {
  authAPI,
  userAPI,
  setToken,
  removeToken,
  getToken,
} from "../config/api.js";

// State management
let currentUser = null;

// Initialize auth state
async function initializeAuth() {
  const token = getToken();
  if (token) {
    try {
      const response = await userAPI.getCurrentUser();
      currentUser = response.user;
    } catch (error) {
      logout();
    }
  }
}

// Login function
export async function login(email, password) {
  try {
    const response = await authAPI.login({ email, password });

    setToken(response.data.token);
    currentUser = response.data.user;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    return { success: true, user: currentUser };
  } catch (error) {
    return { success: false, error: error.msg };
  }
}

// Register function
export async function register(userData) {
  try {
    const response = await authAPI.register(userData);

    setToken(response.data.token);
    currentUser = response.data.user;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    return { success: true, user: currentUser };
  } catch (error) {
    return { success: false, error };
  }
}

// Forgot password
export async function forgotPassword(email) {
  try {
    const response = await authAPI.forgotPassword(email);
    return { success: true, message: response.message };
  } catch (error) {
    return { success: false, error: error.msg };
  }
}

// Reset password
export async function resetPassword(token, email, newPassword) {
  try {
    const response = await authAPI.resetPassword({
      token,
      email,
      new_password: newPassword,
    });
    return { success: true, message: response.message };
  } catch (error) {
    return { success: false, error: error.msg };
  }
}

// Update password
export async function updatePassword(
  currentPassword,
  newPassword,
  confirmPassword
) {
  try {
    const response = await userAPI.updatePassword({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return { success: true, message: response.message };
  } catch (error) {
    return { success: false, error: error.msg };
  }
}

// Logout function
export function logout() {
  removeToken();
  currentUser = null;
  localStorage.removeItem("currentUser");
  window.location.href = "/index.html";
}

// Auth state checks
export function isLoggedIn() {
  const token = localStorage.getItem("authToken");
  return !!token;
}

export function getCurrentUser() {
  if (!currentUser) {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      currentUser = JSON.parse(storedUser);
    }
  }
  return currentUser;
}

export function isAdmin() {
  return currentUser && currentUser.role === "admin";
}

export function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "/login.html";
    return false;
  }
  return true;
}

export function requireAdmin() {
  if (!isAdmin()) {
    alert("Access denied. Admin privileges required.");
    window.location.href = "/index.html";
    return false;
  }
  return true;
}

// Initialize on module load
initializeAuth();
