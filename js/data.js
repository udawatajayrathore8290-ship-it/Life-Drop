/* ===========================================================
   LifeDrop — data.js
   Yeh file ABHI backend ki jagah kaam kar rahi hai.
   Jab backend ready ho (Node.js + MySQL) toh sirf andar ka
   code replace karna — function names same rakhna.
   =========================================================== */

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const CITIES = ["Jaipur", "Ajmer", "Kota"];

/* ---- MOCK DONORS ---- */
let DONORS = [
  { id: "D001", name: "Rohit Sharma", bloodGroup: "O+", city: "Jaipur", contact: "9829011111", password: "demo123", lastDonationDate: "2026-03-12", available: true },
  { id: "D002", name: "Priya Verma", bloodGroup: "A+", city: "Jaipur", contact: "9829022222", password: "demo123", lastDonationDate: "2026-01-02", available: true },
  { id: "D003", name: "Aman Khan", bloodGroup: "B-", city: "Ajmer", contact: "9414033333", password: "demo123", lastDonationDate: "2025-11-20", available: false },
  { id: "D004", name: "Sneha Joshi", bloodGroup: "O-", city: "Jaipur", contact: "9929044444", password: "demo123", lastDonationDate: "2026-05-01", available: true },
  { id: "D005", name: "Vikram Singh", bloodGroup: "AB+", city: "Ajmer", contact: "9729055555", password: "demo123", lastDonationDate: "2026-02-18", available: true },
  { id: "D006", name: "Neha Gupta", bloodGroup: "A-", city: "Jaipur", contact: "9629066666", password: "demo123", lastDonationDate: "2025-09-09", available: false },
  { id: "D007", name: "Karan Mehta", bloodGroup: "B+", city: "Kota", contact: "9529077777", password: "demo123", lastDonationDate: "2026-04-22", available: true },
  { id: "D008", name: "Ritu Choudhary", bloodGroup: "O+", city: "Ajmer", contact: "9329088888", password: "demo123", lastDonationDate: "2026-06-10", available: true },
];

/* ---- MOCK BLOOD BANKS ---- */
let BLOOD_BANKS = [
  {
    id: "B001", name: "Jaipur City Blood Bank", city: "Jaipur",
    contact: "0141-2570001", password: "bank123",
    stock: { "A+": 8, "A-": 2, "B+": 5, "B-": 1, "O+": 10, "O-": 0, "AB+": 3, "AB-": 1 },
  },
  {
    id: "B002", name: "Ajmer Red Cross Blood Bank", city: "Ajmer",
    contact: "0145-2620002", password: "bank123",
    stock: { "A+": 3, "A-": 0, "B+": 2, "B-": 4, "O+": 6, "O-": 1, "AB+": 0, "AB-": 2 },
  },
  {
    id: "B003", name: "SMS Hospital Blood Bank", city: "Jaipur",
    contact: "0141-2518000", password: "bank123",
    stock: { "A+": 1, "A-": 1, "B+": 0, "B-": 0, "O+": 4, "O-": 2, "AB+": 1, "AB-": 0 },
  },
];

/* ---- HELPER FUNCTIONS ---- */

function getDonors() { return DONORS; }
function getBloodBanks() { return BLOOD_BANKS; }

function findDonorByContact(contact) {
  return DONORS.find((d) => d.contact === contact);
}

function findBankByContact(contact) {
  return BLOOD_BANKS.find((b) => b.contact === contact);
}

function addDonor(donor) {
  donor.id = "D" + String(DONORS.length + 1).padStart(3, "0");
  DONORS.push(donor);
  return donor;
}

function addBloodBank(bank) {
  bank.id = "B" + String(BLOOD_BANKS.length + 1).padStart(3, "0");
  BLOOD_BANKS.push(bank);
  return bank;
}

function toggleDonorAvailability(donorId, isAvailable) {
  const donor = DONORS.find((d) => d.id === donorId);
  if (donor) donor.available = isAvailable;
  return donor;
}

function updateStock(bankId, group, newCount) {
  const bank = BLOOD_BANKS.find((b) => b.id === bankId);
  if (bank) bank.stock[group] = Math.max(0, newCount);
  return bank;
}

function searchBlood({ group, city, emergency }) {
  const banks = BLOOD_BANKS.filter((b) => {
    const cityMatch = !city || b.city.toLowerCase() === city.toLowerCase();
    const stockMatch = !group || (b.stock[group] || 0) > 0;
    return cityMatch && stockMatch;
  });

  const donors = DONORS.filter((d) => {
    const cityMatch = !city || d.city.toLowerCase() === city.toLowerCase();
    const groupMatch = !group || d.bloodGroup === group;
    const availMatch = emergency ? true : d.available === true;
    return cityMatch && groupMatch && availMatch;
  });

  return { banks, donors };
}

function monthsSince(dateStr) {
  if (!dateStr) return Infinity;
  const then = new Date(dateStr);
  const now = new Date();
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
}

function isEligibleToDonate(lastDonationDate) {
  return monthsSince(lastDonationDate) >= 3;
}

function initials(name) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(dateStr) {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}