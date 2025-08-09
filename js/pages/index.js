import { carAPI } from "../config/api.js";
import { showError } from "../utils/msg.js";

// State variables
let cars = [];
let currentPage = 1;
let totalPages = 1;
let filters = {};
const limit = 12;

// Page elements
let carsGrid, resultsCount, pagination, priceRange, priceDisplay;
let makeFilter, bodyTypeFilter, stateFilter, applyFiltersBtn, resetBtn;

// Initialize page
function init() {
  const cleanURL = window.location.pathname;
  window.history.replaceState({}, "", cleanURL);

  setupElements();
  setupEventListeners();
  loadCars();
}

function setupElements() {
  carsGrid = document.getElementById("carsGrid");
  resultsCount = document.getElementById("resultsCount");
  pagination = document.getElementById("pagination");
  priceRange = document.getElementById("priceRange");
  priceDisplay = document.getElementById("selectedPriceDisplay");

  // Filter elements
  makeFilter = document.getElementById("makeFilter");
  bodyTypeFilter = document.getElementById("bodyTypeFilter");
  stateFilter = document.getElementById("stateFilter");
  applyFiltersBtn = document.getElementById("applyFiltersBtn");
  resetBtn = document.querySelector(".filter-btn.secondary");
}

function setupEventListeners() {
  // Price range slider
  priceRange.addEventListener("input", updatePriceDisplay);

  // Filter buttons
  applyFiltersBtn.addEventListener("click", applyFilters);
  resetBtn.addEventListener("click", resetFilters);
}

function updatePriceDisplay() {
  const value = parseInt(priceRange.value);
  const formattedPrice =
    value > 100000000 ? "No Limit" : `₦${value.toLocaleString()}`;
  priceDisplay.textContent = formattedPrice;
}

async function loadCars(queryParams = {}) {
  try {
    const response = await carAPI.getAll(queryParams);

    if (response.status === 200) {
      cars = response.data || [];
      updateResultsCount(
        response.totalCars || 0,
        response.totalAvailableCars || 0
      );
      renderCars();
      renderPagination(response);
    }
  } catch (error) {
    console.error("Error loading cars:", error);
    showError("Failed to load cars");
  }
}

function applyFilters() {
  const newFilters = {};

  // Get filter values
  if (makeFilter.value) newFilters.make = makeFilter.value;
  if (bodyTypeFilter.value) newFilters.body_type = bodyTypeFilter.value;
  if (stateFilter.value) newFilters.state = stateFilter.value;

  // Price filter
  const maxPrice = parseInt(priceRange.value);
  if (maxPrice <= 100000000) {
    newFilters.max_price = maxPrice;
  }

  // Pagination
  newFilters.page = 1;
  newFilters.limit = limit;

  currentPage = 1;
  filters = newFilters;

  // 👇 Update the URL
  const newURL = `${window.location.pathname}?${new URLSearchParams(
    newFilters
  ).toString()}`;
  window.history.replaceState({}, "", newURL);
  loadCars(newFilters);
}

function resetFilters() {
  // Reset form elements
  makeFilter.value = "";
  bodyTypeFilter.value = "";
  stateFilter.value = "";
  priceRange.value = 100000000;
  updatePriceDisplay();

  // Reset data
  filters = {};
  currentPage = 1;

  // Reload cars
  loadCars();
  // 👇 Update the URL
  const cleanURL = window.location.pathname;
  window.history.replaceState({}, "", cleanURL);
}

function renderCars() {
  if (!cars || cars.length === 0) {
    carsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <h3 style="color: #666; margin-bottom: 8px;">No cars found</h3>
        <p style="color: #999;">Try adjusting your filters or check back later.</p>
      </div>
    `;
    return;
  }

  carsGrid.innerHTML = cars.map((car) => renderCarCard(car)).join("");
}

function renderCarCard(car) {
  const imageUrl =
    car.images && car.images.length > 0 ? car.images[car.mainPhotoIndex] : "";
  const badgeClass = car.state === "new" ? "" : "used";
  const price =
    typeof car.price === "number" ? car.price.toLocaleString() : car.price;

  return `
    <a href="/car-details?id=${
      car.id
    }" style="text-decoration: none; color: inherit;">
      <div class="car-card">
        <div class="car-image">
          <div class="car-badge ${badgeClass}">${
    car.state === "new" ? "New" : "Used"
  }</div>
          <img src="${imageUrl}" alt="${car.make} ${
    car.model
  }" loading="lazy" />
        </div>
        <div class="car-info">
          <h3 class="car-title">${car.make} ${car.model}</h3>
          <div class="car-price">₦${price}</div>
          <div class="car-location">📍 ${car.location}</div>
        </div>
      </div>
    </a>
  `;
}

function updateResultsCount(filteredCount, totalCount) {
  const showing = filteredCount || 0;
  const total = totalCount || 0;
  resultsCount.textContent = `Showing ${showing} of ${total} vehicles`;
}

function renderPagination(response) {
  const { page = 1, totalPages: total = 1 } = response;
  currentPage = page;
  totalPages = total;

  if (total <= 1) {
    pagination.style.display = "none";
    return;
  }

  pagination.style.display = "flex";

  let paginationHTML = "";

  // Previous button
  paginationHTML += `
    <button class="pagination-btn" ${
      page <= 1 ? "disabled" : ""
    } onclick="goToPage(${page - 1})">
      ‹
    </button>
  `;

  // Page numbers
  if (total <= 7) {
    // Show all pages
    for (let i = 1; i <= total; i++) {
      paginationHTML += `
        <button class="pagination-btn ${
          i === page ? "active" : ""
        }" onclick="goToPage(${i})">
          ${i}
        </button>
      `;
    }
  } else {
    // Show condensed pagination
    paginationHTML += `
      <button class="pagination-btn ${
        1 === page ? "active" : ""
      }" onclick="goToPage(1)">1</button>
    `;

    if (page > 3) {
      paginationHTML += '<span class="pagination-dots">...</span>';
    }

    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(total - 1, page + 1);
      i++
    ) {
      paginationHTML += `
        <button class="pagination-btn ${
          i === page ? "active" : ""
        }" onclick="goToPage(${i})">
          ${i}
        </button>
      `;
    }

    if (page < total - 2) {
      paginationHTML += '<span class="pagination-dots">...</span>';
    }

    paginationHTML += `
      <button class="pagination-btn ${
        total === page ? "active" : ""
      }" onclick="goToPage(${total})">
        ${total}
      </button>
    `;
  }

  // Next button
  paginationHTML += `
    <button class="pagination-btn" ${
      page >= total ? "disabled" : ""
    } onclick="goToPage(${page + 1})">
      ›
    </button>
  `;

  pagination.innerHTML = paginationHTML;
}

function goToPage(pageNumber) {
  if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage) {
    return;
  }

  const queryParams = {
    ...filters,
    page: pageNumber,
    limit: limit,
  };

  // 👇 Update the URL
  const newURL = `${window.location.pathname}?${new URLSearchParams(
    queryParams
  ).toString()}`;
  window.history.replaceState({}, "", newURL);

  loadCars(queryParams);

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.goToPage = goToPage;

document.addEventListener("DOMContentLoaded", init);
