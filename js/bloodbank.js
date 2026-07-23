/* ===========================================================
   LifeDrop — bloodbank.js (Backend connected)
   =========================================================== */

const API = 'https://life-drop.onrender.com/api';

const tabSignup = document.getElementById("tabSignup");
const tabLogin = document.getElementById("tabLogin");
const panelSignup = document.getElementById("panelSignup");
const panelLogin = document.getElementById("panelLogin");

function showSignupTab() {
  tabSignup.classList.add("active");
  tabLogin.classList.remove("active");
  panelSignup.classList.add("active");
  panelLogin.classList.remove("active");
}

function showLoginTab() {
  tabLogin.classList.add("active");
  tabSignup.classList.remove("active");
  panelLogin.classList.add("active");
  panelSignup.classList.remove("active");
}

tabSignup.addEventListener("click", showSignupTab);
tabLogin.addEventListener("click", showLoginTab);

document.getElementById("goToLogin").addEventListener("click", (e) => {
  e.preventDefault();
  showLoginTab();
});

document.getElementById("goToSignup").addEventListener("click", (e) => {
  e.preventDefault();
  showSignupTab();
});

const authCard = document.getElementById("authCard");
const dashboard = document.getElementById("dashboard");
let currentBank = null;

/* ---- DASHBOARD ---- */
function openDashboard(bank) {
  currentBank = bank;
  authCard.style.display = "none";
  dashboard.style.display = "grid";

  document.getElementById("dashAvatar").textContent = initials(bank.name);
  document.getElementById("dashName").textContent = bank.name;
  document.getElementById("dashCity").textContent = bank.city;

  loadStock(bank.id);
}

async function loadStock(bankId) {
  try {
    const res = await fetch(`${API}/bloodbanks/${bankId}/stock`);
    const stock = await res.json();

    const stockMap = {};
    stock.forEach(s => stockMap[s.blood_group] = s.units);

    renderStockGrid(stockMap);
    renderSummary(stockMap);
  } catch (err) {
    showToast("Stock load karne mein error!", "error");
  }
}

function renderSummary(stockMap) {
  const total = Object.values(stockMap).reduce((sum, u) => sum + u, 0);
  const lowCount = Object.values(stockMap).filter(u => u <= 2).length;
  document.getElementById("dashTotalUnits").textContent = total;
  document.getElementById("dashLowGroups").textContent = lowCount;
}

function renderStockGrid(stockMap) {
  const grid = document.getElementById("stockGrid");
  const groups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  grid.innerHTML = groups.map((g) => {
    const count = stockMap[g] || 0;
    return `
      <div class="stock-cell">
        <div class="group-name">${g}</div>
        <div class="unit-controls">
          <button type="button" class="unit-btn" data-group="${g}" data-action="dec">−</button>
          <span class="unit-count" id="count-${g}">${count}</span>
          <button type="button" class="unit-btn" data-group="${g}" data-action="inc">+</button>
        </div>
      </div>`;
  }).join("");

  grid.querySelectorAll(".unit-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const group = btn.dataset.group;
      const action = btn.dataset.action;
      const countEl = document.getElementById(`count-${group}`);
      const current = parseInt(countEl.textContent);
      const updated = action === "inc" ? current + 1 : Math.max(0, current - 1);

      try {
        const res = await fetch(`${API}/bloodbanks/${currentBank.id}/stock`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blood_group: group, units: updated })
        });

        if (res.ok) {
          countEl.textContent = updated;
          const stockMap = {};
          document.querySelectorAll(".unit-count").forEach((el, i) => {
            const grp = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"][i];
            stockMap[grp] = parseInt(el.textContent);
          });
          renderSummary(stockMap);
          showToast(`${group} stock updated to ${updated} units ✅`, "success");
        }
      } catch (err) {
        showToast("Stock update failed!", "error");
      }
    });
  });
}

/* ---- SIGNUP ---- */
document.getElementById("signupForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const bank = {
    name: document.getElementById("suName").value.trim(),
    city: document.getElementById("suCity").value,
    contact: document.getElementById("suContact").value.trim(),
    password: document.getElementById("suPassword").value,
  };

  try {
    const res = await fetch(`${API}/bloodbanks/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bank)
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Registration failed!", "error");
      return;
    }

    bank.id = data.id;
    showToast("Blood bank registered successfully! 🎉", "success");
    openDashboard(bank);

  } catch (err) {
    showToast("Server se connect nahi ho pa raha!", "error");
  }
});

/* ---- LOGIN ---- */
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const contact = document.getElementById("liContact").value.trim();
  const password = document.getElementById("liPassword").value;

  try {
    const res = await fetch(`${API}/bloodbanks/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact, password })
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Login failed!", "error");
      return;
    }

    showToast(`Welcome back, ${data.bank.name}! 🏥`, "success");
    openDashboard(data.bank);

  } catch (err) {
    showToast("Server se connect nahi ho pa raha!", "error");
  }
});

/* ---- LOGOUT ---- */
document.getElementById("logoutBtn").addEventListener("click", function (e) {
  e.preventDefault();
  currentBank = null;
  dashboard.style.display = "none";
  authCard.style.display = "block";
  showLoginTab();
  showToast("Logged out successfully.", "success");
});