// Theme names mapping
const THEME_NAMES = {
  default: "Default",
  glassmorphism: "Glassmorphism",
  minimalism: "Sharp Minimalism",
  neobrutalism: "Neobrutalism",
  scrapbook: "Scrapbook",
  kawaii: "Kawaii Pastel",
  academia: "Academia",
};

// Get current theme from localStorage or default
function getCurrentTheme() {
  return localStorage.getItem("theme") || "default";
}

// Apply theme to body
function applyTheme(theme) {
  // Remove all theme classes
  document.body.removeAttribute("data-theme");

  // Apply new theme if not default
  if (theme !== "default") {
    document.body.setAttribute("data-theme", theme);
  }

  // Save to localStorage
  localStorage.setItem("theme", theme);

  // Update UI
  updateThemeUI(theme);
}

// Update theme UI indicators
function updateThemeUI(theme) {
  // Update current theme indicator
  const currentThemeName = document.getElementById("currentThemeName");
  if (currentThemeName) {
    currentThemeName.textContent = THEME_NAMES[theme];
  }

  // Update all theme buttons
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    const btnTheme = btn.getAttribute("data-theme");
    if (btnTheme === theme) {
      btn.classList.add("active");
      btn.innerHTML = '<i class="fas fa-check-circle"></i> Active';
    } else {
      btn.classList.remove("active");
      btn.innerHTML = '<i class="fas fa-check"></i> Apply';
    }
  });
}

// Initialize theme on page load
function initializeTheme() {
  const currentTheme = getCurrentTheme();
  applyTheme(currentTheme);
}

// Event listeners for theme buttons
document.addEventListener("DOMContentLoaded", () => {
  // Initialize theme
  initializeTheme();

  // Add click listeners to all theme buttons
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const theme = btn.getAttribute("data-theme");
      applyTheme(theme);

      // Show success feedback
      showNotification(`Theme changed to ${THEME_NAMES[theme]}!`);
    });
  });

  // Add click listeners to theme cards (clicking anywhere on card applies theme)
  document.querySelectorAll(".theme-card").forEach((card) => {
    card.addEventListener("click", () => {
      const theme = card.getAttribute("data-theme");
      applyTheme(theme);
      showNotification(`Theme changed to ${THEME_NAMES[theme]}!`);
    });
  });

  // Reset button
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      applyTheme("default");
      showNotification("Theme reset to default!");
    });
  }
});

// Show notification
function showNotification(message) {
  // Remove existing notification if any
  const existingNotification = document.querySelector(".theme-notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = "theme-notification";
  notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;

  // Add styles
  notification.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

  // Add animation
  const style = document.createElement("style");
  style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
  document.head.appendChild(style);

  // Append to body
  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Export for use in other pages
window.themeManager = {
  getCurrentTheme,
  applyTheme,
  initializeTheme,
};
