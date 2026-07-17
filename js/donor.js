/* ===========================================================
   LifeDrop — donor.js (Backend connected + Profile Edit)
   =========================================================== */

const API = 'http://localhost:5000/api';

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
let currentDonor = null;

/* ---- POPUP HELPERS ---- */
function showPopup(id) {
  document.getElementById(id).classList.add("show");
}
function hidePopup(id) {
  document.getElementById(id).classList.remove("show");
}

/* ---- DASHBOARD TABS ---- */
const tabProfile = document.getElementById("tabProfile");
const tabAvail = document.getElementById("tabAvail");
const panelProfile = document.getElementById("panelProfile");
const panelAvail = document.getElementById("panelAvail");

tabProfile.addEventListener("click", () => {
  tabProfile.classList.add("active");
  tabAvail.classList.remove("active");
  panelProfile.classList.add("active");
  panelAvail.classList.remove("active");
});

tabAvail.addEventListener("click", () => {
  tabAvail.classList.add("active");
  tabProfile.classList.remove("active");
  panelAvail.classList.add("active");
  panelProfile.classList.remove("active");
});

/* ---- DASHBOARD ---- */
function openDashboard(donor) {
  currentDonor = donor;
  authCard.style.display = "none";
  dashboard.style.display = "grid";

  document.getElementById("dashAvatar").textContent = initials(donor.name);
  document.getElementById("dashName").textContent = donor.name;
  document.getElementById("dashGroup").textContent = donor.blood_group;
  document.getElementById("dashCity").textContent = donor.city;
  document.getElementById("dashLastDonation").textContent = formatDate(donor.last_donation_date);

  fillProfileView(donor);

  const toggle = document.getElementById("availabilityToggle");
  toggle.checked = !!donor.available;
  updateEligibilityNote(donor);
}

function fillProfileView(donor) {
  document.getElementById("viewName").textContent = donor.name;
  document.getElementById("viewBloodGroup").textContent = donor.blood_group;
  document.getElementById("viewCity").textContent = donor.city;
  document.getElementById("viewContact").textContent = donor.contact;
  document.getElementById("viewLastDonation").textContent = formatDate(donor.last_donation_date);
}

function updateEligibilityNote(donor) {
  
  const note = document.getElementById("eligibilityNote");
  const toggle = document.getElementById("availabilityToggle");
  const eligibilityCard = document.getElementById("eligibilityCard");

  if (!donor.last_donation_date) {
    // Kabhi donate nahi kiya — eligible hai
    note.textContent = "This updates instantly for anyone searching.";
    note.style.color = "var(--gray-500)";
    toggle.disabled = false;
    eligibilityCard.style.display = "none";
    return;
  }

  const lastDate = new Date(donor.last_donation_date);
  const now = new Date();

  // 4 mahine baad eligible hoga
  const eligibleDate = new Date(lastDate);
  eligibleDate.setMonth(eligibleDate.getMonth() + 3);

  const totalDays = 90; // 4 mahine ~ 120 din
  const daysSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, totalDays - daysSince);
  const progressPercent = Math.min(100, (daysSince / totalDays) * 100);

  if (daysRemaining > 0) {
    // Abhi eligible nahi
    toggle.disabled = true;
    toggle.checked = false;
    donor.available = false;

    // Eligibility card dikhao
    eligibilityCard.style.display = "block";
    document.getElementById("daysRemaining").textContent = `${daysRemaining} days remaining`;
    document.getElementById("nextEligibleDate").textContent = eligibleDate.toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric"
    });
    document.getElementById("eligibilityBar").style.width = `${progressPercent}%`;

    // Toggle note
    note.textContent = `You cannot donate yet — ${daysRemaining} days remaining.`;
    note.style.color = "var(--amber-600)";

  } else {
    // Eligible hai
    toggle.disabled = false;
    eligibilityCard.style.display = "none";
    note.textContent = "This updates instantly for anyone searching.";
    note.style.color = "var(--gray-500)";
  }
}


/* ---- EDIT PROFILE ---- */
document.getElementById("editProfileBtn").addEventListener("click", () => {
  document.getElementById("profileView").style.display = "none";
  document.getElementById("profileEdit").style.display = "block";
  document.getElementById("editProfileBtn").style.display = "none";

  // Fill edit form with current values
  document.getElementById("editName").value = currentDonor.name;
  document.getElementById("editBloodGroup").value = currentDonor.blood_group;
  document.getElementById("editCity").value = currentDonor.city;
  document.getElementById("editContact").value = currentDonor.contact;
  document.getElementById("editLastDonation").value = currentDonor.last_donation_date || "";
});

document.getElementById("cancelEditBtn").addEventListener("click", () => {
  document.getElementById("profileView").style.display = "block";
  document.getElementById("profileEdit").style.display = "none";
  document.getElementById("editProfileBtn").style.display = "inline-flex";
});

document.getElementById("editProfileForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const updated = {
    name: document.getElementById("editName").value.trim(),
    blood_group: document.getElementById("editBloodGroup").value,
    city: document.getElementById("editCity").value,
    contact: document.getElementById("editContact").value.trim(),
    last_donation_date: document.getElementById("editLastDonation").value || null,
  };

  try {
    const res = await fetch(`${API}/donors/${currentDonor.id}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });

    if (res.ok) {
      // Update currentDonor
      currentDonor = { ...currentDonor, ...updated };

      // Update dashboard
      document.getElementById("dashAvatar").textContent = initials(currentDonor.name);
      document.getElementById("dashName").textContent = currentDonor.name;
      document.getElementById("dashGroup").textContent = currentDonor.blood_group;
      document.getElementById("dashCity").textContent = currentDonor.city;
      document.getElementById("dashLastDonation").textContent = formatDate(currentDonor.last_donation_date);

      fillProfileView(currentDonor);
      updateEligibilityNote(currentDonor);

      // Switch back to view mode
      document.getElementById("profileView").style.display = "block";
      document.getElementById("profileEdit").style.display = "none";
      document.getElementById("editProfileBtn").style.display = "inline-flex";

      showToast("Profile updated successfully! ✅", "success");
    }
  } catch (err) {
    showToast("Profile update failed!", "error");
  }
});

/* ---- SIGNUP ---- */
document.getElementById("signupForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const donor = {
    name: document.getElementById("suName").value.trim(),
    blood_group: document.getElementById("suBloodGroup").value,
    city: document.getElementById("suCity").value,
    contact: document.getElementById("suContact").value.trim(),
    password: document.getElementById("suPassword").value,
    last_donation_date: document.getElementById("suLastDonation").value || null,
  };

  try {
    const res = await fetch(`${API}/donors/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donor)
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Registration failed!", "error");
      return;
    }

    donor.id = data.id;
    document.getElementById("signupPopupName").textContent = `Welcome, ${donor.name}! 🎉`;
    showPopup("signupPopup");

    document.getElementById("signupPopupBtn").onclick = () => {
      hidePopup("signupPopup");
      openDashboard(donor);
    };

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
    const res = await fetch(`${API}/donors/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact, password })
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Login failed!", "error");
      return;
    }

    showToast(`Welcome back, ${data.donor.name}!`, "success");
    openDashboard(data.donor);

  } catch (err) {
    showToast("Server se connect nahi ho pa raha!", "error");
  }
});

/* ---- AVAILABILITY TOGGLE ---- */
let pendingToggleState = null;

document.getElementById("availabilityToggle").addEventListener("change", function () {
  if (!currentDonor) return;
  pendingToggleState = this.checked;
  this.checked = !this.checked;

  if (pendingToggleState) {
    document.getElementById("availPopupIcon").textContent = "✅";
    document.getElementById("availPopupTitle").textContent = "Mark as Available?";
    document.getElementById("availPopupMsg").textContent = "Donors nearby will be able to see your contact details.";
  } else {
    document.getElementById("availPopupIcon").textContent = "⏸️";
    document.getElementById("availPopupTitle").textContent = "Mark as Unavailable?";
    document.getElementById("availPopupMsg").textContent = "You will not appear in search results until you mark yourself available again.";
  }
  showPopup("availabilityPopup");
});

document.getElementById("availConfirmBtn").addEventListener("click", async () => {
  const toggle = document.getElementById("availabilityToggle");

  try {
    const res = await fetch(`${API}/donors/${currentDonor.id}/availability`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: pendingToggleState })
    });

    if (res.ok) {
      toggle.checked = pendingToggleState;
      currentDonor.available = pendingToggleState;
      hidePopup("availabilityPopup");
      showToast(
        pendingToggleState ? "You are now Available ✅" : "You are now Unavailable ⏸️",
        "success"
      );
    }
  } catch (err) {
    showToast("Update failed!", "error");
  }
});

document.getElementById("availCancelBtn").addEventListener("click", () => {
  hidePopup("availabilityPopup");
});

/* ---- LOGOUT ---- */
document.getElementById("logoutBtn").addEventListener("click", function (e) {
  e.preventDefault();
  showPopup("logoutPopup");
});

document.getElementById("logoutConfirmBtn").addEventListener("click", () => {
  hidePopup("logoutPopup");
  currentDonor = null;
  dashboard.style.display = "none";
  authCard.style.display = "block";
  showLoginTab();
  showToast("Logged out successfully.", "success");
});

document.getElementById("logoutCancelBtn").addEventListener("click", () => {
  hidePopup("logoutPopup");
});