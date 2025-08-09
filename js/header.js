import * as auth from "./services/auth.js";

class DynamicHeader {
  constructor() {
    this.isInitialized = false;
    this.documentClickHandler = null;
    this.resizeHandler = null;
    this.scrollHandler = null;
    this.currentAuthState = null;
    this.init();
  }

  init() {
    if (this.isInitialized) {
      return;
    }

    this.createHeaderHTML();
    this.currentAuthState = auth.isLoggedIn();
    this.renderHeader();
    this.setupEventListeners();
    this.setupScrollEffects();
    this.isInitialized = true;
  }

  // Check if auth state changed and re-render if needed
  checkAuthStateAndUpdate() {
    const newAuthState = auth.isLoggedIn();
    if (this.currentAuthState !== newAuthState) {
      this.currentAuthState = newAuthState;
      this.renderHeader();
    }
  }

  createHeaderHTML() {
    // Prevent duplicate header creation
    if (document.querySelector(".header")) {
      return;
    }

    const headerHTML = `
      <header class="header">
        <nav class="nav-content">
          <a href="/" class="logo-container">
            <div class="logo-icon">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_6_535)">
                  <path fill-rule="evenodd" clip-rule="evenodd" 
                        d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" 
                        fill="currentColor"/>
                </g>
                <defs>
                  <clipPath id="clip0_6_535">
                    <rect width="48" height="48" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
            </div>
            <h1 class="logo-text">AutoMart</h1>
          </a>
        </nav>
      </header>
    `;

    document.body.insertAdjacentHTML("afterbegin", headerHTML);
    document.body.style.paddingTop = "80px";
  }

  setupEventListeners() {
    // Remove existing listeners to prevent duplicates
    this.removeEventListeners();

    // Create bound handlers for easier removal
    this.documentClickHandler = this.handleDocumentClick.bind(this);
    this.resizeHandler = this.handleWindowResize.bind(this);

    document.addEventListener("click", this.documentClickHandler);
    window.addEventListener("resize", this.resizeHandler);
  }

  removeEventListeners() {
    if (this.documentClickHandler) {
      document.removeEventListener("click", this.documentClickHandler);
    }
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
    }
    if (this.scrollHandler) {
      window.removeEventListener("scroll", this.scrollHandler);
    }
  }

  handleDocumentClick(e) {
    const menuToggle = e.target.closest("#menuToggle");
    const userProfile = e.target.closest("#userProfile");
    const dropdownMenu = e.target.closest(".dropdown-menu");
    const clickedAvatarOrInfo = e.target.closest(".user-data");
    const logoutButton = e.target.closest("#logoutButton");

    if (logoutButton) {
      e.preventDefault();
      e.stopPropagation();
      this.handleLogout();
      return;
    }

    if (menuToggle) {
      e.preventDefault();
      e.stopPropagation();
      this.toggleMobileMenu();
      return;
    }

    if (userProfile && clickedAvatarOrInfo) {
      e.preventDefault();
      e.stopPropagation();
      this.toggleUserDropdown();
      return;
    }

    if (!dropdownMenu && !userProfile) {
      this.closeAllDropdowns();
    }
  }

  handleWindowResize() {
    if (window.innerWidth > 768) {
      this.closeMobileMenu();
    }
  }

  setupScrollEffects() {
    if (this.scrollHandler) {
      window.removeEventListener("scroll", this.scrollHandler);
    }

    this.scrollHandler = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const header = document.querySelector(".header");

      if (header) {
        if (scrollTop > 10) {
          header.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06)";
        } else {
          header.style.boxShadow = "none";
        }
      }
    };

    window.addEventListener("scroll", this.scrollHandler);
  }

  handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
      auth.logout();
    }
  }

  toggleMobileMenu() {
    const navLinks = document.getElementById("navLinks");
    const menuToggle = document.getElementById("menuToggle");

    if (navLinks && menuToggle) {
      const isOpening = !navLinks.classList.contains("active");

      navLinks.classList.toggle("active");
      menuToggle.classList.toggle("active");

      if (isOpening) {
        this.closeUserDropdown();
      }
    }
  }

  closeMobileMenu() {
    const navLinks = document.getElementById("navLinks");
    const menuToggle = document.getElementById("menuToggle");

    if (navLinks && menuToggle) {
      navLinks.classList.remove("active");
      menuToggle.classList.remove("active");
      this.closeUserDropdown();
    }
  }

  toggleUserDropdown() {
    const dropdownMenu = document.getElementById("dropdownMenu");

    if (dropdownMenu) {
      dropdownMenu.classList.toggle("active");
    }
  }

  closeAllDropdowns() {
    const dropdowns = document.querySelectorAll(".dropdown-menu");
    dropdowns.forEach((dropdown) => {
      dropdown.classList.remove("active");
    });
    this.closeMobileMenu();
  }

  closeUserDropdown() {
    const dropdowns = document.querySelectorAll(".dropdown-menu");
    dropdowns.forEach((dropdown) => {
      dropdown.classList.remove("active");
    });
  }

  getAuthButtons() {
    return `
      <div class="auth-buttons">
        <a href="/login" class="button button-secondary">Sign In</a>
        <a href="/register" class="button button-primary">Sign Up</a>
      </div>
    `;
  }

  getNavigationContainer() {
    const user = auth.getCurrentUser();
    const isAdmin = auth.isAdmin();

    const userName = user ? `${user.first_name} ${user.last_name}` : "User";
    const userInitials = user
      ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
      : "U";

    return `
      <div class="nav-container">
        <nav class="nav-links" id="navLinks">
          <a href="/" class="tab">Car Listings</a>
          <a href="/add-car" class="tab">Create Listing</a>
         
          <div class="user-profile" id="userProfile">
            <div class="user-data">
              <div class="user-avatar">${userInitials}</div>
              <div class="user-info">
                <span class="user-name">${userName}</span>
                <span class="user-role">${isAdmin ? "Admin" : "Member"}</span>
              </div>
            </div>
            <div class="dropdown-menu" id="dropdownMenu">
              <a href="/update-password" class="dropdown-item">
                <span>⚙️</span>
                Update Password
              </a>
              <a href="/my-listings" class="dropdown-item">
                <span>🚗</span>
                My Listings
              </a>
              ${
                isAdmin
                  ? `
                <a href="/admin-dashboard" class="dropdown-item admin-only">
                  <span>🔧</span>
                  View All Cars
                </a>
              `
                  : ""
              }
              <button class="dropdown-item logout" id="logoutButton">
                <span>🚪</span>
                Logout
              </button>
            </div>
          </div>
        </nav>

        <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    `;
  }

  renderHeader() {
    const headerContent = document.querySelector(".nav-content");
    if (!headerContent) return;

    // Clear existing auth/nav
    const existingAuth = headerContent.querySelector(".auth-buttons");
    const existingNav = headerContent.querySelector(".nav-container");

    if (existingAuth) existingAuth.remove();
    if (existingNav) existingNav.remove();

    // Add appropriate content based on auth status
    const contentHTML = auth.isLoggedIn()
      ? this.getNavigationContainer()
      : this.getAuthButtons();

    headerContent.insertAdjacentHTML("beforeend", contentHTML);
  }

  // Cleanup method for removing event listeners
  destroy() {
    this.removeEventListeners();
    this.isInitialized = false;
  }
}

export { DynamicHeader };
