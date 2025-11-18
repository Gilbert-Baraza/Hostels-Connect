// This admin panel now uses the Node.js/MongoDB backend.
// NOTE: The auth logic is simplified to use localStorage for this example.
// In a real app, you would use JWTs and a proper login flow with the backend.

// --- Globals ---
const API_URL = "http://localhost:5000/api"; // Your backend URL
let hostels = [];
const hostelList = document.getElementById("hostelList");

// --- Helper: Message Toast ---
function showMessage(message) {
  const msgBox = document.createElement("div");
  msgBox.style.cssText = `
    position:fixed;top:20px;right:20px;
    padding:15px;background:#333;color:white;
    border-radius:8px;z-index:10000;
    box-shadow:0 4px 8px rgba(0,0,0,0.2);
  `;
  msgBox.textContent = message;
  document.body.appendChild(msgBox);
  setTimeout(() => msgBox.remove(), 3000);
}

// --- Helper: Confirmation Modal ---
function showConfirmModal(message, onConfirm) {
  let modal = document.getElementById("customConfirmModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "customConfirmModal";
    modal.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.5);z-index:2000;
      display:flex;justify-content:center;align-items:center;
    `;
    modal.innerHTML = `
      <div style="background:white;padding:25px;border-radius:10px;
                  box-shadow:0 5px 15px rgba(0,0,0,0.3);max-width:350px;">
        <p id="confirmMessage">${message}</p>
        <button id="confirmYes" style="margin-right:10px;">Yes</button>
        <button id="confirmNo" style="background:#ccc; color:#333;">No</button>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    document.getElementById("confirmMessage").textContent = message;
    modal.style.display = "flex";
  }

  document.getElementById("confirmYes").onclick = () => {
    onConfirm();
    modal.style.display = "none";
  };
  document.getElementById("confirmNo").onclick = () => {
    modal.style.display = "none";
  };
}

// --- Auth & Initial Load ---
document.addEventListener("DOMContentLoaded", () => {
  // Simplified auth check. Replace with JWT logic later.
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser || currentUser.role !== "admin") {
    showMessage("Access Denied. Admins only.", true);
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("adminName").textContent = currentUser.name;
  loadHostels();
});

// --- Load Hostels from Backend API ---
async function loadHostels() {
  const response = await fetch(`${API_URL}/hostels`);
  hostels = await response.json();
  renderHostels();
}

// --- Render Hostels ---
function renderHostels() {
  hostelList.innerHTML = "";

  if (!hostels.length) {
    hostelList.innerHTML = `<tr><td colspan="6">No hostels uploaded yet.</td></tr>`;
    return;
  }

  hostels.forEach((hostel) => {
    const row = document.createElement("tr");
    const id = hostel._id; // MongoDB uses _id
    const isApproved = hostel.approved === true;

    row.innerHTML = `
      <td>${hostel.name}</td>
      <td>${hostel.location}</td>
      <td>${hostel.price}</td>
      <td>${hostel.landlord || "Unknown"}</td>
      <td>${isApproved ? "✅ Yes" : "⏳ No"}</td>
      <td>
        ${
          isApproved
            ? `<button class="delete-btn" data-id="${id}">Delete</button>`
            : `<button class="approve-btn" data-id="${id}">Approve</button>
               <button class="delete-btn" data-id="${id}">Delete</button>`
        }
      </td>
    `;

    hostelList.appendChild(row);
  });

  // --- Attach Button Events ---
  document.querySelectorAll(".approve-btn").forEach(btn => {
    btn.addEventListener("click", (e) => approveHostel(e.target.dataset.id));
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      showConfirmModal("Are you sure you want to delete this hostel?", () =>
        deleteHostel(id)
      );
    });
  });
}

// --- Approve Hostel ---
async function approveHostel(hostelId) {
  try {
    const response = await fetch(`${API_URL}/hostels/${hostelId}/approve`, {
      method: "PATCH",
    });
    if (!response.ok) throw new Error("Server responded with an error.");

    showMessage("✅ Hostel approved successfully!");
    loadHostels(); // Refresh the list
  } catch (error) {
    console.error("Error approving hostel:", error);
    showMessage("Failed to approve hostel.", true);
  }
}

async function deleteHostel(hostelId) {
  try {
    const response = await fetch(`${API_URL}/hostels/${hostelId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Server responded with an error.");

    showMessage("🗑️ Hostel deleted.");
    loadHostels(); // Refresh the list
  } catch (error) {
    console.error("Error deleting hostel:", error);
    showMessage("Failed to delete hostel.", true);
  }
}

// --- Logout (Simplified) ---
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "../index.html";
});