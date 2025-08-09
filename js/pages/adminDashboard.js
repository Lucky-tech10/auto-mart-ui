import { carAPI } from "../config/api.js";
import * as auth from "../services/auth.js";
import { showError, showSuccess } from "../utils/msg.js";

// State variables
let cars = [];
let carToDelete = null;

// Page elements
let tableBody, emptyState, deleteModal, confirmDeleteBtn;

// Initialize page
function init() {
  // Check authentication and admin role
  if (!auth.requireAuth() || !auth.requireAdmin()) return;

  setupElements();
  loadAllCars();
}

function setupElements() {
  tableBody = document.getElementById("listingsTableBody");
  emptyState = document.getElementById("emptyState");
  deleteModal = document.getElementById("deleteModal");
  confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  // Setup delete confirmation
  confirmDeleteBtn.addEventListener("click", confirmDelete);
}

async function loadAllCars() {
  try {
    const response = await carAPI.getAdminCars();

    if (response.status === 200) {
      cars = response.data || [];
      renderCars();
    }
  } catch (error) {
    console.error("Error loading cars:", error);
    showError("Failed to load car listings");
  }
}

function renderCars() {
  if (!cars || cars.length === 0) {
    tableBody.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";
  tableBody.innerHTML = cars.map((car) => renderCarRow(car)).join("");
}

function renderCarRow(car) {
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
        <div class="owner-info">
          <h5>Member</h5>
          <p>${car.owner_email || "user@example.com"}</p>
        </div>
      </td>
      <td>
        <div class="price-display">₦${formattedPrice}</div>
      </td>
      <td>
        <span class="status-badge status-${car.status}">${car.status}</span>
      </td>
      <td>
        <button class="btn btn-danger" onclick="deleteCar('${car.id}', '${
    car.make
  } ${car.model}')">
          Delete
        </button>
      </td>
    </tr>
  `;
}

function deleteCar(carId, carName) {
  carToDelete = { id: carId, name: carName };
  const deleteMessage = document.getElementById("deleteMessage");
  deleteMessage.textContent = `Are you sure you want to delete the ${carName} listing? This action cannot be undone.`;
  deleteModal.style.display = "flex";
}

function closeDeleteModal() {
  deleteModal.style.display = "none";
  carToDelete = null;
}

async function confirmDelete() {
  if (!carToDelete) return;

  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = "Deleting...";

  try {
    const deletedCarName = carToDelete.name;
    const response = await carAPI.delete(carToDelete.id);

    if (response.status === 200) {
      await loadAllCars();
      closeDeleteModal();
      showSuccess(`${deletedCarName} has been deleted successfully`);
    } else {
      showError(response.msg || "Failed to delete car listing");
    }
  } catch (error) {
    showError(error.message || "Failed to delete car listing");
  } finally {
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.textContent = "Delete";
  }
}

window.deleteCar = deleteCar;
window.closeDeleteModal = closeDeleteModal;

document.addEventListener("DOMContentLoaded", init);
