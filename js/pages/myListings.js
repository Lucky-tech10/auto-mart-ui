import { carAPI } from "../config/api.js";
import * as auth from "../services/auth.js";
import { showError, showSuccess } from "../utils/msg.js";

// State variables
let listings = [];
let editingCarId = null;
let originalData = {};

// Page elements
let tableBody, emptyState;

// Initialize page
function init() {
  if (!auth.requireAuth()) return;

  setupElements();
  loadUserListings();
}

function setupElements() {
  tableBody = document.getElementById("listingsTableBody");
  emptyState = document.getElementById("emptyState");
}

async function loadUserListings() {
  try {
    const response = await carAPI.getUserCars();

    if (response.status === 200) {
      listings = response.data || [];
      renderListings();
    }
  } catch (error) {
    console.error("Error loading user listings:", error.msg);
    showError("Failed to load your listings");
  }
}

function renderListings() {
  if (!listings || listings.length === 0) {
    tableBody.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";
  tableBody.innerHTML = listings.map((car) => renderCarRow(car)).join("");
}

function renderCarRow(car) {
  const isEditing = editingCarId === car.id;
  const imageUrl =
    car.images && car.images.length > 0 ? car.images[car.mainPhotoIndex] : "";
  const price =
    typeof car.price === "number" ? car.price : parseFloat(car.price) || 0;
  const formattedPrice = price.toLocaleString();

  return `
    <tr data-car-id="${car.id}">
      <td>
        <div class="car-info">
          <img src="${imageUrl}" alt="${car.make} ${
    car.model
  }" class="car-image">
          <div class="car-details">
            <h4>${car.make} ${car.model}</h4>
          </div>
        </div>
      </td>
      <td>
        <div class="price-display" style="display: ${
          isEditing ? "none" : "block"
        }">
          ₦${formattedPrice}
        </div>
        <div class="edit-form ${isEditing ? "active" : ""}" style="display: ${
    isEditing ? "flex" : "none"
  }">
          <input type="number" class="edit-input" id="price-${
            car.id
          }" value="${price}" placeholder="Price">
        </div>
      </td>
      <td>
        <div class="status-display" style="display: ${
          isEditing ? "none" : "block"
        }">
          <span class="status-badge status-${car.status}">${car.status}</span>
        </div>
        <div class="edit-form ${isEditing ? "active" : ""}" style="display: ${
    isEditing ? "flex" : "none"
  }">
          <select class="edit-select" id="status-${car.id}">
            <option value="available" ${
              car.status === "available" ? "selected" : ""
            }>Available</option>
            <option value="sold" ${
              car.status === "sold" ? "selected" : ""
            }>Sold</option>
          </select>
        </div>
      </td>
      <td>
        <div class="action-buttons">
          ${
            isEditing
              ? `
            <button class="btn btn-primary" onclick="saveChanges('${car.id}')">Save</button>
            <button class="btn btn-secondary" onclick="cancelEdit('${car.id}')">Cancel</button>
          `
              : `
            <button class="btn btn-primary" onclick="editListing('${car.id}')">Edit</button>
          `
          }
        </div>
      </td>
    </tr>
  `;
}

function editListing(carId) {
  const car = listings.find((c) => c.id === carId);
  if (!car) return;

  // Store original data
  originalData = {
    price: car.price,
    status: car.status,
  };

  editingCarId = carId;
  renderListings();
}

function cancelEdit(carId) {
  editingCarId = null;
  originalData = {};
  renderListings();
}

async function saveChanges(carId) {
  const priceInput = document.getElementById(`price-${carId}`);
  const statusSelect = document.getElementById(`status-${carId}`);

  const newPrice = parseFloat(priceInput.value);
  const newStatus = statusSelect.value;

  // Validation
  if (!newPrice || newPrice <= 0) {
    showError("Please enter a valid price");
    return;
  }

  if (!["available", "sold"].includes(newStatus)) {
    showError("Please select a valid status");
    return;
  }

  try {
    // Update price if changed
    const car = listings.find((c) => c.id === carId);
    if (car && newPrice !== parseFloat(car.price)) {
      await carAPI.updatePrice(carId, newPrice);
    }

    // Update status if changed
    if (car && newStatus !== car.status) {
      await carAPI.updateStatus(carId, newStatus);
    }

    // Update local data
    const carIndex = listings.findIndex((c) => c.id === carId);
    if (carIndex !== -1) {
      listings[carIndex].price = newPrice;
      listings[carIndex].status = newStatus;
    }

    editingCarId = null;
    originalData = {};
    renderListings();
    showSuccess("Changes saved successfully!");
  } catch (error) {
    console.error("Error saving changes:", error.msg);
    showError(error.msg || "Failed to save changes");
  }
}

window.editListing = editListing;
window.cancelEdit = cancelEdit;
window.saveChanges = saveChanges;

document.addEventListener("DOMContentLoaded", init);
