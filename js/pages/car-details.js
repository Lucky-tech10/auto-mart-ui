import { carAPI, orderAPI, flagAPI } from "../config/api.js";
import * as auth from "../services/auth.js";
import { showError, showSuccess } from "../utils/msg.js";

// State variables
let carId = null;
let car = null;
let userState = {
  hasOrdered: false,
  hasFlagged: false,
  currentOffer: 0,
  orderId: null,
};
let currentImageIndex = 0;

// Page elements - stored globally
let carImage, carBadge, carTitle, carPrice, carDescription, galleryCounter;
let quickInfoGrid, offerBtn, reportBtn;
let offerModal, reportModal, offerAmount, submitOfferBtn, submitReportBtn;

// Initialize page
function init() {
  getCarIdFromURL();
  if (!carId) {
    window.location.href = "/index";
    return;
  }

  setupElements();
  setupEventListeners();
  loadCarDetails();

  if (auth.isLoggedIn()) {
    loadUserActions();
  }
}

function setupElements() {
  // Car display elements
  carImage = document.querySelector(".car-imaged img");
  carBadge = document.querySelector(".car-badged");
  carTitle = document.querySelector(".car-titles");
  carPrice = document.querySelector(".car-prices");
  carDescription = document.querySelector(".description-text");
  galleryCounter = document.getElementById("galleryCounter");

  // Quick info elements
  quickInfoGrid = document.querySelector(".car-quick-info");

  // Action buttons
  offerBtn = document.getElementById("offerBtn");
  reportBtn = document.getElementById("reportBtn");

  // Modal elements
  offerModal = document.getElementById("offerModal");
  reportModal = document.getElementById("reportModal");
  offerAmount = document.getElementById("offerAmount");
  submitOfferBtn = document.getElementById("submitOfferBtn");
  submitReportBtn = document.getElementById("submitReportBtn");
}

function getCarIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  carId = urlParams.get("id");
}

function setupEventListeners() {
  // Gallery navigation
  const galleryNavs = document.querySelectorAll(".gallery-nav");
  galleryNavs.forEach((nav, index) => {
    nav.addEventListener("click", () => {
      if (index === 0) previousImage();
      else nextImage();
    });
  });

  // Modal controls - close when clicking outside
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      closeModal(e.target.id);
    }
  });

  // Close modals with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const activeModal = document.querySelector(".modal-overlay.active");
      if (activeModal) {
        closeModal(activeModal.id);
      }
    }
  });

  // Form submissions
  if (submitOfferBtn) {
    submitOfferBtn.addEventListener("click", handleOfferSubmit);
  }

  if (submitReportBtn) {
    submitReportBtn.addEventListener("click", handleReportSubmit);
  }

  // Input validation
  if (offerAmount) {
    offerAmount.addEventListener("input", validateOfferAmount);
    // Format input to numbers only
    offerAmount.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "");
    });
  }

  // Report form setup
  setupReportForm();
}

async function loadCarDetails() {
  try {
    const response = await carAPI.getById(carId);

    if (response.status === 200) {
      car = response.data;
      renderCarDetails();
      updateActionButtons();
    }
  } catch (error) {
    console.error("Error loading car details:", error.message);
    showError("Failed to load car details");
    setTimeout(() => {
      window.location.href = "/index";
    }, 2000);
  }
}

async function loadUserActions() {
  try {
    const response = await carAPI.getUserActions(carId);

    if (response.status === 200) {
      const { hasOrdered, hasFlagged } = response.data;
      userState.hasOrdered = hasOrdered;
      userState.hasFlagged = hasFlagged;
      // Reset order details - will be loaded when modal opens if needed
      userState.currentOffer = 0;
      userState.orderId = null;

      updateActionButtons();
    }
  } catch (error) {
    console.error("Error loading user actions:", error.message);
  }
}

function renderCarDetails() {
  if (!car) return;

  document.title = `AutoMart - ${car.make} ${car.model} details`;

  updateBreadcrumb();

  // Update quick info
  renderQuickInfo();

  // Update basic info
  carTitle.textContent = `${car.make} ${car.model}`;
  carPrice.textContent = `₦${car.price.toLocaleString()}`;
  carDescription.textContent = car.description || "No description available.";

  // Update badge
  carBadge.textContent = car.state === "new" ? "New" : "Used";
  carBadge.className = `car-badged ${car.state === "new" ? "" : "used"}`;

  // Update images
  if (car.images && car.images.length > 0) {
    carImage.src = car.images[car.mainPhotoIndex];
    updateGalleryCounter();
  }

  updateSellerInfo();
}

function updateSellerInfo() {
  const user = auth.getCurrentUser();

  const userName = user ? `${user.first_name} ${user.last_name}` : "User";
  const userInitials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    : "U";

  const avatarEl = document.querySelector(".seller-avatar");
  const nameEl = document.querySelector(".seller-name");

  if (avatarEl) avatarEl.textContent = userInitials;
  if (nameEl) nameEl.textContent = userName;
}

function renderQuickInfo() {
  const quickInfoData = [
    { icon: "🏷️", label: "Make", value: car.make },
    { icon: "🚗", label: "Body Type", value: car.body_type },
    { icon: "📍", label: "Location", value: car.location },
  ];

  quickInfoGrid.innerHTML = quickInfoData
    .map(
      (info) => `
      <div class="quick-info-item">
        <div class="quick-info-icon">${info.icon}</div>
        <div class="quick-info-label">${info.label}</div>
        <div class="quick-info-value">${info.value}</div>
      </div>
    `
    )
    .join("");
}

function updateBreadcrumb() {
  const currentBreadcrumb = document.querySelector(".breadcrumb-item.current");
  if (currentBreadcrumb && car) {
    currentBreadcrumb.textContent = `${car.make} ${car.model}`;
  }
}

// Gallery functions
function previousImage() {
  if (!car.images || car.images.length <= 1) return;
  currentImageIndex =
    currentImageIndex > 0 ? currentImageIndex - 1 : car.images.length - 1;
  updateCurrentImage();
}

function nextImage() {
  if (!car.images || car.images.length <= 1) return;
  currentImageIndex =
    currentImageIndex < car.images.length - 1 ? currentImageIndex + 1 : 0;
  updateCurrentImage();
}

function updateCurrentImage() {
  if (car.images && car.images[currentImageIndex]) {
    carImage.src = car.images[currentImageIndex];
    updateGalleryCounter();
  }
}

function updateGalleryCounter() {
  const total = car.images ? car.images.length : 1;
  if (galleryCounter) {
    galleryCounter.textContent = `${currentImageIndex + 1} / ${total}`;
  }
}

function updateActionButtons() {
  if (!auth.isLoggedIn()) {
    if (offerBtn) {
      offerBtn.onclick = () => redirectToLogin();
    }
    if (reportBtn) {
      reportBtn.onclick = () => redirectToLogin();
    }
    return;
  }

  // Update offer button if user has made an offer
  if (offerBtn && userState.hasOrdered) {
    offerBtn.innerHTML = "💰 Update Offer";
    offerBtn.setAttribute("data-has-offer", "true");
  }

  // Disable report button if user has already flagged this car
  if (reportBtn && userState.hasFlagged) {
    reportBtn.disabled = true;
    reportBtn.innerHTML = "🚩 Already Reported";
    reportBtn.style.opacity = "0.6";
    reportBtn.style.cursor = "not-allowed";
  }
}

function redirectToLogin() {
  showError("Please login to perform this action");
  setTimeout(() => {
    window.location.href = "/login";
  }, 1500);
}

// Modal functions
async function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  // Load fresh order details when opening offer modal
  if (modalId === "offerModal" && userState.hasOrdered && auth.isLoggedIn()) {
    await loadOrderDetails();
  }

  if (modalId === "offerModal") {
    configureOfferModal();
  }
}

async function loadOrderDetails() {
  try {
    const response = await carAPI.getUserCarOrder(carId);

    if (response.status === 200 && response.data) {
      userState.currentOffer = response.data.amount;
      userState.orderId = response.data.id;
    }
  } catch (error) {
    console.error("Error loading order details:", error);
    showError(error.message || "Failed to load order details");
    userState.currentOffer = 0;
    userState.orderId = null;
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.remove("active");
  document.body.style.overflow = "";

  // Reset forms when closing
  if (modalId === "offerModal") {
    resetOfferForm();
  } else if (modalId === "reportModal") {
    resetReportForm();
  }
}

// Simplified offer modal configuration
function configureOfferModal() {
  const modalTitle = document.getElementById("offerModalTitle");
  const offerAmountLabel = document.getElementById("offerAmountLabel");
  const currentOfferInfo = document.getElementById("currentOfferInfo");
  const currentUserOffer = document.getElementById("currentUserOffer");
  const submitBtn = document.getElementById("submitOfferBtn");
  const currentOffer = document.getElementById("currentOffer");

  // Show car price
  if (currentOffer && car?.price) {
    currentOffer.textContent = `₦${car.price.toLocaleString()}`;
  }

  const hasValidOffer = userState.hasOrdered && userState.currentOffer > 0;

  if (hasValidOffer) {
    // Updating existing offer
    if (modalTitle) modalTitle.textContent = "Update Your Offer";
    if (offerAmountLabel) offerAmountLabel.textContent = "New Offer Amount";
    if (submitBtn) submitBtn.textContent = "Update Offer";

    if (currentOfferInfo) currentOfferInfo.style.display = "block";
    if (currentUserOffer)
      currentUserOffer.textContent = `₦${userState.currentOffer.toLocaleString()}`;
    if (offerAmount) {
      offerAmount.value = userState.currentOffer.toString();
      setTimeout(() => validateOfferAmount(), 100);
    }
  } else {
    // Making new offer
    if (modalTitle) modalTitle.textContent = "Make an Offer";
    if (offerAmountLabel) offerAmountLabel.textContent = "Your Offer Amount";
    if (submitBtn) submitBtn.textContent = "Submit Offer";

    if (currentOfferInfo) currentOfferInfo.style.display = "none";
    if (offerAmount) offerAmount.value = "";
    if (submitBtn) submitBtn.disabled = true;
  }
}

// Form validation functions
function validateOfferAmount() {
  if (!offerAmount || !submitOfferBtn) return;

  const amount = parseFloat(offerAmount.value);
  const isValid = amount > 0 && !isNaN(amount);

  submitOfferBtn.disabled = !isValid;

  // Optional: Add visual feedback
  if (offerAmount.value && !isValid) {
    offerAmount.style.borderColor = "#e53e3e";
  } else {
    offerAmount.style.borderColor = "";
  }
}

function validateReportForm() {
  const selectedReason = document.querySelector(
    'input[name="reportReason"]:checked'
  );

  if (submitReportBtn) {
    submitReportBtn.disabled = !selectedReason;
  }
}

// Report form setup
function setupReportForm() {
  const reasonOptions = document.querySelectorAll(".reason-option");

  reasonOptions.forEach((option) => {
    option.addEventListener("click", function () {
      // Remove selected class from all options
      reasonOptions.forEach((opt) => opt.classList.remove("selected"));

      // Add selected class to clicked option
      this.classList.add("selected");

      // Select the radio button
      const radio = this.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
      }

      validateReportForm();
    });
  });

  // listen for direct radio button changes
  const radioButtons = document.querySelectorAll('input[name="reportReason"]');
  radioButtons.forEach((radio) => {
    radio.addEventListener("change", validateReportForm);
  });
}

// Form submission handlers
async function handleOfferSubmit() {
  const amount = parseFloat(offerAmount.value);

  if (!amount || amount <= 0) {
    showError("Please enter a valid offer amount");
    return;
  }

  submitOfferBtn.disabled = true;
  submitOfferBtn.textContent = "Submitting...";

  try {
    if (userState.hasOrdered && userState.orderId) {
      // Update existing offer
      await orderAPI.updatePrice(userState.orderId, amount);
      userState.currentOffer = amount;
      showSuccess("Offer updated successfully!");
    } else {
      // Create new offer
      const response = await orderAPI.create({
        car_id: carId,
        amount: amount,
      });

      // Save the order details
      userState.hasOrdered = true;
      userState.currentOffer = amount;
      userState.orderId = response.data.id;
      showSuccess("Offer submitted successfully!");
      updateActionButtons();
    }

    setTimeout(() => closeModal("offerModal"), 2000);
  } catch (error) {
    console.error("Error submitting offer:", error);
    showError(error.message || "Failed to submit offer");
  } finally {
    submitOfferBtn.disabled = false;
    submitOfferBtn.textContent = userState.hasOrdered
      ? "Update Offer"
      : "Submit Offer";
  }
}

async function handleReportSubmit() {
  const selectedReason = document.querySelector(
    'input[name="reportReason"]:checked'
  );
  const details = document.getElementById("reportDetails")?.value || "";

  if (!selectedReason) {
    showError("Please select a reason for reporting");
    return;
  }

  // Show loading state
  submitReportBtn.disabled = true;
  submitReportBtn.textContent = "Submitting...";

  try {
    await flagAPI.create({
      car_id: carId,
      reason: selectedReason.value,
      description: details,
    });

    showSuccess("Report submitted successfully!");
    userState.hasFlagged = true;
    updateActionButtons();

    setTimeout(() => {
      closeModal("reportModal");
    }, 2000);
  } catch (error) {
    showError(error.message || "Failed to submit report");
  } finally {
    // Reset button state
    submitReportBtn.disabled = false;
    submitReportBtn.textContent = "Submit Report";
  }
}

// Form reset functions
function resetOfferForm() {
  if (offerAmount) {
    offerAmount.value = "";
    offerAmount.style.borderColor = "";
  }

  if (submitOfferBtn) {
    submitOfferBtn.disabled = true;
  }
}

function resetReportForm() {
  // Clear all radio selections
  const radioButtons = document.querySelectorAll('input[name="reportReason"]');
  radioButtons.forEach((radio) => (radio.checked = false));

  // Remove selected styling
  const reasonOptions = document.querySelectorAll(".reason-option");
  reasonOptions.forEach((option) => option.classList.remove("selected"));

  // Clear details textarea
  const details = document.getElementById("reportDetails");
  if (details) details.value = "";

  // Disable submit button
  if (submitReportBtn) {
    submitReportBtn.disabled = true;
  }
}

window.openModal = openModal;
window.closeModal = closeModal;
window.nextImage = nextImage;
window.previousImage = previousImage;

document.addEventListener("DOMContentLoaded", init);
