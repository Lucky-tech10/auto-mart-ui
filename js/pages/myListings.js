import { carAPI } from "../config/api.js";
import * as auth from "../services/auth.js";
import { showError, showSuccess } from "../utils/msg.js";

// State variables
let listings = [];
let editingCarId = null;

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
          <a href="/car-details?id=${
            car.id
          }" style="text-decoration: none; color: inherit;">
            <div class="car-details">
              <h4>${car.make} ${car.model}</h4>
            </div>
          </a>
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
            <button class="btn btn-secondary" onclick="cancelEdit()">Cancel</button>
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
  editingCarId = carId;
  renderListings();
}

function cancelEdit() {
  editingCarId = null;
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

  const car = listings.find((c) => c.id === carId);
  if (!car) {
    showError("Car not found");
    return;
  }
  if (car && newPrice === parseFloat(car.price) && newStatus === car.status) {
    editingCarId = null;
    return;
  }

  try {
    // Update price if changed
    if (car && newPrice !== parseFloat(car.price)) {
      const res = await carAPI.updatePrice(carId, newPrice);
      if (res.status !== 200) {
        showError(res.msg || "Failed to update price");
      }
    }

    // Update status if changed
    if (car && newStatus !== car.status) {
      const res = await carAPI.updateStatus(carId, newStatus);
      if (res.status !== 200) {
        showError(res.msg || "Failed to update status");
      }
    }

    editingCarId = null;
    await loadUserListings();
    showSuccess("Changes saved successfully!");
  } catch (error) {
    showError(error.message || "Failed to save changes");
  }
}

window.editListing = editListing;
window.cancelEdit = cancelEdit;
window.saveChanges = saveChanges;

document.addEventListener("DOMContentLoaded", init);
