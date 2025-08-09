import { carAPI } from "../config/api.js";
import * as auth from "../services/auth.js";
import { showError, showSuccess, clearErrors } from "../utils/msg.js";

// Global variables
let selectedPhotos = [];
let mainPhotoIndex = 0;
const maxFiles = 5;
const maxFileSize = 1024 * 1024; // 1MB

// DOM elements
let photoUploadArea,
  photoInput,
  photoPreviews,
  uploadProgress,
  progressBar,
  submitBtn,
  carForm;

// Initialize the app
document.addEventListener("DOMContentLoaded", function () {
  // Check authentication first
  if (!auth.requireAuth()) return;

  initializeElements();
  setupEventListeners();
  setupPriceFormatting();
  preventEnterSubmission();
  setupTextareaResize();
  setLoading(false);
});

// Initialize DOM elements
function initializeElements() {
  photoUploadArea = document.getElementById("photoUploadArea");
  photoInput = document.getElementById("photoInput");
  photoPreviews = document.getElementById("photoPreviews");
  uploadProgress = document.getElementById("uploadProgress");
  progressBar = document.getElementById("progressBar");
  submitBtn = document.getElementById("submitBtn");
  carForm = document.getElementById("carForm");
}

// Event listeners
function setupEventListeners() {
  // Photo upload events
  photoInput.addEventListener("change", handlePhotoSelection);
  photoUploadArea.addEventListener("click", (e) => {
    if (
      e.target === photoUploadArea ||
      e.target.closest(".upload-icon, .upload-text, .upload-subtitle")
    ) {
      photoInput.click();
    }
  });
  photoUploadArea.addEventListener("dragover", handleDragOver);
  photoUploadArea.addEventListener("dragleave", handleDragLeave);
  photoUploadArea.addEventListener("drop", handleDrop);

  // Form submission
  carForm.addEventListener("submit", handleFormSubmit);

  // Clear errors on input
  const inputs = carForm.querySelectorAll(".form-input, .form-select");
  inputs.forEach((input) => {
    input.addEventListener("input", clearErrors);
  });
}

// Photo handling functions
function handlePhotoSelection(event) {
  const files = Array.from(event.target.files);
  processPhotos(files);
}

function handleDragOver(event) {
  event.preventDefault();
  photoUploadArea.classList.add("drag-over");
}

function handleDragLeave(event) {
  event.preventDefault();
  photoUploadArea.classList.remove("drag-over");
}

function handleDrop(event) {
  event.preventDefault();
  photoUploadArea.classList.remove("drag-over");

  const files = Array.from(event.dataTransfer.files).filter((file) =>
    file.type.startsWith("image/")
  );

  if (files.length > 0) {
    processPhotos(files);
  }
}

function processPhotos(files) {
  // Limit to maxFiles photos total
  const remainingSlots = maxFiles - selectedPhotos.length;
  const filesToAdd = files.slice(0, remainingSlots);

  if (filesToAdd.length === 0) {
    showError(`You can only upload up to ${maxFiles} photos.`);
    return;
  }

  // Validate files before processing
  const validFiles = [];
  for (let file of filesToAdd) {
    if (validateFile(file)) {
      validFiles.push(file);
    }
  }

  if (validFiles.length === 0) {
    showError("Invalid, pls check file types and sizes.");
    return;
  }

  // Show progress bar
  uploadProgress.style.display = "block";
  let processed = 0;

  validFiles.forEach((file) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      const photoData = {
        file: file,
        dataUrl: e.target.result,
        name: file.name,
        size: file.size,
      };

      selectedPhotos.push(photoData);
      processed++;

      // Update progress
      const progress = (processed / validFiles.length) * 100;
      progressBar.style.width = progress + "%";

      if (processed === validFiles.length) {
        updatePhotoPreview();
        setTimeout(() => {
          uploadProgress.style.display = "none";
          progressBar.style.width = "0%";
        }, 500);
      }
    };

    reader.readAsDataURL(file);
  });

  // Reset input
  photoInput.value = "";
}

function validateFile(file) {
  // Check file type
  if (!file.type.startsWith("image/")) {
    showError("Please select only image files");
    return false;
  }

  // Check file size
  if (file.size > maxFileSize) {
    showError("Each image must be less than 1MB");
    return false;
  }

  // Check supported formats
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (!allowedTypes.includes(file.type)) {
    showError("Please select JPEG, PNG images only");
    return false;
  }

  return true;
}

function updatePhotoPreview() {
  photoPreviews.innerHTML = "";

  selectedPhotos.forEach((photo, index) => {
    const photoDiv = document.createElement("div");
    photoDiv.className = "photo-preview";

    photoDiv.innerHTML = `
      <img src="${photo.dataUrl}" alt="Photo ${index + 1}">
      <button type="button" class="photo-remove" onclick="removePhoto(${index})" title="Remove photo">
        ×
      </button>
      ${
        index === mainPhotoIndex
          ? '<div class="photo-main-indicator">Main Photo</div>'
          : ""
      }
    `;

    // Make photo clickable to set as main
    photoDiv.addEventListener("click", (e) => {
      if (!e.target.classList.contains("photo-remove")) {
        setMainPhoto(index);
      }
    });

    photoPreviews.appendChild(photoDiv);
  });
}

function removePhoto(index) {
  selectedPhotos.splice(index, 1);

  // Adjust main photo index if necessary
  if (mainPhotoIndex >= selectedPhotos.length) {
    mainPhotoIndex = Math.max(0, selectedPhotos.length - 1);
  } else if (index <= mainPhotoIndex && mainPhotoIndex > 0) {
    mainPhotoIndex--;
  }

  updatePhotoPreview();
}

function setMainPhoto(index) {
  mainPhotoIndex = index;
  updatePhotoPreview();
}

// Form validation - simplified
function validateForm() {
  const requiredFields = [
    "make",
    "model",
    "location",
    "bodyType",
    "price",
    "state",
    "description",
  ];
  let isValid = true;

  // Validate required fields
  for (let fieldId of requiredFields) {
    const field = document.getElementById(fieldId);
    if (!field || !field.value.trim()) {
      showError(`Please fill in all required fields`);
      isValid = false;
      break;
    }
  }

  // Validate photos
  if (selectedPhotos.length === 0) {
    showError("Please add at least one photo of your car.");
    isValid = false;
  }

  // Validate price is positive number
  const price = document.getElementById("price");
  if (price.value && parseFloat(price.value) <= 0) {
    showError("Price must be a positive number.");
    isValid = false;
  }

  return isValid;
}

// Form submission
async function handleFormSubmit(event) {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  setLoading(true);

  try {
    await submitCarAd();
  } catch (error) {
    console.error("Error submitting car ad:", error);
    showError(error.msg || "Failed to create car listing. Please try again.");
  } finally {
    setLoading(false);
  }
}

async function submitCarAd() {
  const formData = new FormData();

  // Get form data - map to API expected field names
  const fields = {
    make: document.getElementById("make").value,
    model: document.getElementById("model").value,
    price: document.getElementById("price").value,
    location: document.getElementById("location").value,
    state: document.getElementById("state").value,
    body_type: document.getElementById("bodyType").value,
    description: document.getElementById("description").value || "",
    status: "available",
    mainPhotoIndex,
  };

  // Add fields to FormData
  Object.keys(fields).forEach((key) => {
    formData.append(key, fields[key]);
  });

  // Add images to FormData
  selectedPhotos.forEach((photo) => {
    formData.append("images", photo.file);
  });

  // Submit to API
  const response = await carAPI.create(formData);

  if (response.status === 201) {
    showSuccess("Car listing created successfully!");
    setTimeout(() => {
      resetForm();
      window.location.href = "/my-listings.html";
    }, 3000);
  }
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;

  if (isLoading) {
    submitBtn.classList.add("loading");
    submitBtn.innerHTML = `
      <div class="loading-spinner"></div>
      🚀 Publishing...
    `;
  } else {
    submitBtn.classList.remove("loading");
    submitBtn.innerHTML = "🚀 Publish Your Car Ad";
  }
}

function resetForm() {
  carForm.reset();
  selectedPhotos = [];
  mainPhotoIndex = 0;
  updatePhotoPreview();
}

// Auto-format price input
function setupPriceFormatting() {
  const priceInput = document.getElementById("price");
  if (priceInput) {
    priceInput.addEventListener("input", function (e) {
      let value = e.target.value.replace(/[^0-9]/g, "");
      if (value) {
        e.target.value = value;
      }
    });
  }
}

// Prevent form submission on Enter key in input fields (except textarea)
function preventEnterSubmission() {
  document.querySelectorAll(".form-input, .form-select").forEach((input) => {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
      }
    });
  });
}

// Auto-resize textarea
function setupTextareaResize() {
  const descriptionTextarea = document.getElementById("description");
  if (descriptionTextarea) {
    descriptionTextarea.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = Math.max(this.scrollHeight, 120) + "px";
    });
  }
}

window.removePhoto = removePhoto;
