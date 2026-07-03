/* ===========================================================
   LifeDrop — main.js
   Shared across every page: mobile nav toggle + toast helper.
   =========================================================== */

function setupMobileNav() {
  const toggleBtn = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".mobile-menu");
  if (toggleBtn && menu) {
    toggleBtn.addEventListener("click", () => {
      menu.classList.toggle("open");
    });
  }
}

function showToast(message, type = "success") {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast toast-${type} show`;
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

document.addEventListener("DOMContentLoaded", setupMobileNav);