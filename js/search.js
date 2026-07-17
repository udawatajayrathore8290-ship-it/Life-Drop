/* ===========================================================
   LifeDrop — search.js (Backend connected)
   =========================================================== */

const API = 'http://localhost:5000/api';

const form = document.getElementById("searchForm");
const bankResults = document.getElementById("bankResults");
const donorResults = document.getElementById("donorResults");
const resultsCount = document.getElementById("resultsCount");
const activeFilters = document.getElementById("activeFilters");
const emergencyToggle = document.getElementById("emergencyToggle");

function renderBanks(banks) {
  if (banks.length === 0) {
    bankResults.innerHTML = `<div class="empty-state card">
      <div class="icon-circle">🏥</div>
      <p>No blood banks found with matching stock.</p>
    </div>`;
    return;
  }

  // Banks ko group karo by id
  const bankMap = {};
  banks.forEach(b => {
    if (!bankMap[b.id]) {
      bankMap[b.id] = {
        id: b.id, name: b.name, city: b.city,
        contact: b.contact, stock: {}
      };
    }
    if (b.blood_group) {
      bankMap[b.id].stock[b.blood_group] = b.units;
    }
  });

  const groups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  bankResults.innerHTML = Object.values(bankMap).map((b) => {
    const stockHtml = groups.map((g) => {
      const count = b.stock[g] ?? 0;
      return `<span class="stock-pill">${g}: ${count}</span>`;
    }).join("");
    return `
      <div class="result-card">
        <div class="result-left">
          <div class="result-avatar">🏥</div>
          <div>
            <div class="result-name">${b.name}</div>
            <div class="result-sub">${b.city} • ${b.contact}</div>
          </div>
        </div>
        <div class="result-right">
          <div class="stock-mini">${stockHtml}</div>
        </div>
      </div>`;
  }).join("");
}

function renderDonors(donors) {
  // Stats update karo
  const statsSummary = document.getElementById("statsSummary");
  const total = donors.length;
  const available = donors.filter(d => d.available === 1 || d.available === true).length;
  const notEligible = total - available;

  if (total > 0) {
    statsSummary.style.display = "grid";
    document.getElementById("statTotal").textContent = total;
    document.getElementById("statAvailable").textContent = available;
    document.getElementById("statNotEligible").textContent = notEligible;
  } else {
    statsSummary.style.display = "none";
  }

  if (donors.length === 0) {
    donorResults.innerHTML = `<div class="empty-state card">
      <div class="icon-circle">🧑‍🤝‍🧑</div>
      <p>No donors found. Try Emergency Mode to widen results.</p>
    </div>`;
    return;
  }

  donorResults.innerHTML = donors.map((d) => {
    // Eligibility check
    let eligibilityBadge = "";
    if (d.last_donation_date) {
      const lastDate = new Date(d.last_donation_date);
      const now = new Date();
      const daysSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 120 - daysSince);

      if (daysRemaining > 0) {
        eligibilityBadge = `<span class="badge badge-low">
          <span class="badge-dot"></span>
          ${daysRemaining} days to donate
        </span>`;
      } else {
        eligibilityBadge = `<span class="badge badge-available">
          <span class="badge-dot"></span>
          Eligible to Donate
        </span>`;
      }
    }

    const availBadge = (d.available === 1 || d.available === true)
      ? `<span class="badge badge-available"><span class="badge-dot"></span>Available</span>`
      : `<span class="badge badge-unavailable"><span class="badge-dot"></span>Not Available</span>`;

    return `
      <div class="result-card">
        <div class="result-left">
          <div class="result-avatar">${initials(d.name)}</div>
          <div>
            <div class="result-name">${d.name}</div>
            <div class="result-sub">${d.city} • ${d.contact}</div>
          </div>
        </div>
        <div class="result-right" style="flex-wrap:wrap; gap:8px;">
          <span class="result-group-tag">${d.blood_group}</span>
          ${availBadge}
          ${eligibilityBadge}
        </div>
      </div>`;
  }).join("");
}

function renderChips(group, city, urgency) {
  const chips = [];
  if (group) chips.push(`Group: ${group}`);
  if (city) chips.push(`City: ${city}`);
  if (urgency === "emergency") chips.push("⚠️ Emergency");
  activeFilters.innerHTML = chips.map((c) =>
    `<span class="filter-chip">${c}</span>`
  ).join("");
}

async function runSearch() {
  const group = document.getElementById("bloodGroup").value;
  const city = document.getElementById("city").value;
  const urgency = document.getElementById("urgency").value;
  const emergency = emergencyToggle.checked || urgency === "emergency";

  resultsCount.textContent = "Searching...";
  renderChips(group, city, urgency);

  try {
    const params = new URLSearchParams();
    if (group) params.append("group", group);
    if (city) params.append("city", city);
    if (emergency) params.append("emergency", "true");

    const res = await fetch(`${API}/search?${params.toString()}`);
    const data = await res.json();

    resultsCount.textContent = `Found ${data.banks.length} blood bank(s) and ${data.donors.length} donor(s)`;
    renderBanks(data.banks);
    renderDonors(data.donors);

  } catch (err) {
    resultsCount.textContent = "Error loading results!";
    showToast("Server se connect nahi ho pa raha!", "error");
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  runSearch();
});

emergencyToggle.addEventListener("change", runSearch);

runSearch();