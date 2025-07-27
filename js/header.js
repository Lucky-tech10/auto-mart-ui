// header.js
class DynamicHeader {
  constructor() {
    this.isLoggedIn = true;
    // this.currentUser = null;

    this.init();
  }

  init() {
    this.createHeaderHTML();
    this.renderHeader();
    // Setup event listeners AFTER rendering
    this.setupEventListeners();
    this.setupScrollEffects();
  }

  createHeaderHTML() {
    // if header already exists
    if (document.querySelector(".header")) {
      return;
    }

    const headerHTML = `
      <header class="header">
        <nav class="nav-content">
          <a href="/index.html" class="logo-container">
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
    // Remove any existing listeners to prevent duplicates
    if (this.documentClickHandler) {
      document.removeEventListener("click", this.documentClickHandler);
    }

    // Create bound handler for easier removal
    this.documentClickHandler = (e) => {
      const menuToggle = e.target.closest("#menuToggle");
      const userProfile = e.target.closest("#userProfile");
      const dropdownMenu = e.target.closest(".dropdown-menu");
      const clickedAvatarOrInfo = e.target.closest(".user-data");

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

      // Close dropdowns when clicking outside
      if (!dropdownMenu && !userProfile) {
        this.closeAllDropdowns();
      }
    };

    document.addEventListener("click", this.documentClickHandler);

    // Window resize handler
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
    }

    this.resizeHandler = () => {
      if (window.innerWidth > 768) {
        this.closeMobileMenu();
      }
    };

    window.addEventListener("resize", this.resizeHandler);
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

  toggleMobileMenu() {
    // console.log("toggleMobileMenu called");
    const navLinks = document.getElementById("navLinks");
    const menuToggle = document.getElementById("menuToggle");

    if (navLinks && menuToggle) {
      const isOpening = !navLinks.classList.contains("active");

      navLinks.classList.toggle("active");
      menuToggle.classList.toggle("active");

      // If opening mobile menu, ensure dropdown is closed
      if (isOpening) {
        this.closeUserDropdown();
      }
    } else {
      console.log("Could not find navLinks or menuToggle elements");
    }
  }

  closeMobileMenu() {
    const navLinks = document.getElementById("navLinks");
    const menuToggle = document.getElementById("menuToggle");

    if (navLinks && menuToggle) {
      navLinks.classList.remove("active");
      menuToggle.classList.remove("active");
      // Also close dropdown when mobile menu closes
      this.closeUserDropdown();
    }
  }

  toggleUserDropdown() {
    const dropdownMenu = document.getElementById("dropdownMenu");

    if (dropdownMenu) {
      const isActive = dropdownMenu.classList.contains("active");

      if (isActive) {
        dropdownMenu.classList.remove("active");
      } else {
        dropdownMenu.classList.add("active");
      }
    } else {
      console.log("Could not find dropdownMenu element");
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
        <a href="/login.html" class="button button-secondary">Sign In</a>
        <a href="/register.html" class="button button-primary">Sign Up</a>
      </div>
    `;
  }

  getNavigationContainer() {
    const isAdmin = true;

    return `
      <div class="nav-container">
        <nav class="nav-links" id="navLinks">
          <a href="/index.html" class="tab">Car Listings</a>
          <a href="/add/car.html" class="tab">Create Listing</a>
         
          <div class="user-profile" id="userProfile">
            <div class="user-data">
              <div class="user-avatar">U</div>
              <div class="user-info">
                <span class="user-name">User</span>
                <span class="user-role">Member</span>
              </div>
            </div>
            <div class="dropdown-menu" id="dropdownMenu">
              <a href="/reset-password.html" class="dropdown-item">
                <span>⚙️</span>
                Reset Password
              </a>
              <a href="/my-listings.html" class="dropdown-item">
                <span>🚗</span>
                My Listings
              </a>
              ${
                isAdmin
                  ? `
                <a href="/admin-dashboard.html" class="dropdown-item admin-only">
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

    // Clear existing auth/nav content
    const existingAuth = headerContent.querySelector(".auth-buttons");
    const existingNav = headerContent.querySelector(".nav-container");

    if (existingAuth) existingAuth.remove();
    if (existingNav) existingNav.remove();

    // Add appropriate content based on auth status
    const contentHTML = this.isLoggedIn
      ? this.getNavigationContainer()
      : this.getAuthButtons();

    headerContent.insertAdjacentHTML("beforeend", contentHTML);
  }

  // Cleanup method for removing event listeners
  destroy() {
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

  showError(message) {
    alert(message);
  }

  showSuccess(message) {
    alert(message);
  }
}

export { DynamicHeader };
