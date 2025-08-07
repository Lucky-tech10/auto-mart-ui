const API_BASE_URL = "http://localhost:5000/api/v1";

// Token management
const getToken = () => localStorage.getItem("authToken");
const setToken = (token) => localStorage.setItem("authToken", token);
const removeToken = () => localStorage.removeItem("authToken");

// Headers helper
const getHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

const getMultipartHeaders = () => {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

// Generic request function
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = { headers: getHeaders(), ...options };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || data.message || "Something went wrong");
    }
    return data;
  } catch (error) {
    throw error;
  }
}

// Multipart request function
async function apiRequestMultipart(endpoint, formData) {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getMultipartHeaders(),
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || data.message || "Something went wrong");
    }
    return data;
  } catch (error) {
    throw error;
  }
}

// Auth API functions
export const authAPI = {
  register: (userData) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  forgotPassword: (email) =>
    apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (resetData) =>
    apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(resetData),
    }),
};

// User API functions
export const userAPI = {
  getCurrentUser: () => apiRequest("/user/showUser"),

  updatePassword: (passwordData) =>
    apiRequest("/user/update-password", {
      method: "PATCH",
      body: JSON.stringify(passwordData),
    }),
};

// Car API functions
export const carAPI = {
  create: (formData) => apiRequestMultipart("/car", formData),

  getAll: (queryParams = {}) => {
    const query = new URLSearchParams(queryParams).toString();
    const endpoint = query ? `/car?${query}` : "/car";
    return apiRequest(endpoint);
  },

  getUserCars: () => apiRequest("/car/user"),

  getAdminCars: () => apiRequest("/car/admin"),

  getById: (carId) => apiRequest(`/car/${carId}`),

  updatePrice: (carId, price) =>
    apiRequest(`/car/${carId}/price`, {
      method: "PATCH",
      body: JSON.stringify({ price }),
    }),

  updateStatus: (carId, status) =>
    apiRequest(`/car/${carId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  delete: (carId) => apiRequest(`/car/${carId}`, { method: "DELETE" }),

  getUserActions: (carId) => apiRequest(`/car/${carId}/actions`),
};

// Order API functions
export const orderAPI = {
  create: (orderData) =>
    apiRequest("/order", {
      method: "POST",
      body: JSON.stringify(orderData),
    }),

  updatePrice: (orderId, newPrice) =>
    apiRequest(`/order/${orderId}/price`, {
      method: "PATCH",
      body: JSON.stringify({ new_price: newPrice }),
    }),
};

// Flag API functions
export const flagAPI = {
  create: (flagData) =>
    apiRequest("/flag", {
      method: "POST",
      body: JSON.stringify(flagData),
    }),
};

// Export token management functions
export { setToken, removeToken, getToken };
