// This script now uses the Node.js/MongoDB backend.

// --- Globals-----
const API_URL = "http://localhost:5000/api";
let currentUser = null;
let hostels = [];
let bookings = [];

// --- Hardcoded Locations ---
function populateLocationDropdown() {
  const locationSelect = document.getElementById("locationSelect");
  if (!locationSelect) return;

  const places = [
    "Kibabii University",
    "Kanduyi",
    "Namaloko",
    "Bungoma Town",
    "Tuuti",
    "Mayanja",
    "Makutano Junction",
    "Booster Junction",
    "Bukananachi",
    "Butieli",
  ];

  locationSelect.innerHTML = `<option value="">Select Location</option>`;
  places.forEach(place => {
    const opt = document.createElement("option");
    opt.value = place;
    opt.textContent = place;
    locationSelect.appendChild(opt);
  });
}

// --- Toast ---
function showMessage(message, isError = false) {
  const msg = document.createElement("div");
  msg.style.cssText = `
    position:fixed;top:20px;right:20px;
    padding:15px;background:${isError ? "#dc3545" : "#333"};
    color:white;border-radius:8px;z-index:10000;
    box-shadow:0 4px 8px rgba(0,0,0,0.2);
  `;
  msg.textContent = message;
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 4000);
}

// --- Auth State ---
document.addEventListener("DOMContentLoaded", () => {
  currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser || currentUser.role !== "landlord") {
    showMessage("Access denied. Please log in as a landlord.", true);
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("landlordName").textContent = currentUser.name;
  setupDashboard();
});

// --- Dashboard Setup ---
async function setupDashboard() {
  populateLocationDropdown();

  const form = document.getElementById("hostelForm");
  const myHostelsTable = document.getElementById("myHostels");
  const pendingBookingsBody = document.getElementById("pendingBookings");

  // --- Upload Hostel ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const paymentFrequency = document.getElementById("paymentFrequency").value.trim();
    const roomType = document.getElementById("roomType").value.trim();
    const imageInput = document.getElementById("image");
    if (imageInput.files.length === 0) {
      showMessage("Please select an image for the hostel.", true);
      return;
    }

    const formData = new FormData();
    const rooms = parseInt(document.getElementById("rooms").value.trim(), 10);

    formData.append("name", document.getElementById("hostelName").value.trim());
    formData.append("location", document.getElementById("locationSelect").value.trim());
    formData.append("price", parseFloat(document.getElementById("price").value.trim()));
    formData.append("roomsAvailable", rooms);
    formData.append("totalRooms", rooms);
    formData.append("rulesAndRegulations", document.getElementById("rulesAndRegulations").value.trim());
    formData.append("landlord", currentUser.name);
    formData.append("landlordId", currentUser.id);
    formData.append("paymentFrequency", paymentFrequency);
    formData.append("roomType", roomType);
    formData.append("approved", true); // Or false, depending on your workflow
    formData.append("image", imageInput.files[0]); // Append the file

    try {
      const response = await fetch(`${API_URL}/hostels`, {
        method: 'POST',
        body: formData // Send FormData, browser sets Content-Type automatically
      });
      if (!response.ok) throw new Error('Upload failed');

      showMessage("✅ Hostel uploaded successfully! Pending admin approval.");
      form.reset();
      loadInitialData(); // Refresh data
    } catch (error) {
      console.error("Upload error:", error);
      showMessage("Failed to upload hostel.", true);
    }
  });

  // --- Render Hostels ---
  function renderMyHostels() {
    myHostelsTable.innerHTML = hostels.length
      ? hostels.filter(h => h.landlordId === currentUser.id).map(h => `
        <tr id="hostel-row-${h._id}">
          <td>${h.name}</td>
          <td>${h.location}</td>
          <td>${h.price}</td>
          <td>${h.roomsAvailable ?? 0}</td>
          <td>${h.approved ? "✅ Approved" : "⏳ Pending"}</td>
        </tr>
      `).join("")
      : "<tr><td colspan='5'>No hostels uploaded yet.</td></tr>";
  }

  // --- Render Bookings ---
  function renderBookings() {
    const pending = bookings.filter(b => b.landlordId === currentUser.id && b.status === "pending");
    pendingBookingsBody.innerHTML = pending.length
      ? pending.map(b => `
        <tr>
          <td>${b.hostelName}</td>
          <td>${b.student}</td>
          <td>${new Date(b.createdAt).toLocaleDateString()}</td>
          <td>
            <button class="approve-booking-btn" data-id="${b._id}">Approve</button>
            <button class="reject-booking-btn" data-id="${b._id}">Reject</button>
          </td>
        </tr>
      `).join("")
      : "<tr><td colspan='4'>No pending bookings.</td></tr>";

    document.querySelectorAll(".approve-booking-btn").forEach(btn =>
      btn.addEventListener("click", e => approveBooking(e.target.dataset.id))
    );
    document.querySelectorAll(".reject-booking-btn").forEach(btn =>
      btn.addEventListener("click", e => rejectBooking(e.target.dataset.id))
    );
  }

  // --- Approve & Reject Booking ---
  async function approveBooking(bookingId) {
    try {
      // Approve the booking
      await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      });

      // Decrement hostel rooms
      const booking = bookings.find(b => b._id === bookingId);
      const hostel = hostels.find(h => h._id === booking.hostelId);
      if (hostel && hostel.roomsAvailable > 0) {
        await fetch(`${API_URL}/hostels/${hostel._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomsAvailable: hostel.roomsAvailable - 1 })
        });
      }

      showMessage(`✅ Booking approved!`);
      loadInitialData(); // Refresh data once after all operations
    } catch (error) {
      console.error("Approve error:", error);
      showMessage("❌ Failed to approve booking.", true);
    }
  }

  async function rejectBooking(bookingId) {
    try {
      await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });
      showMessage(`❌ Booking rejected.`);
      loadInitialData();
    } catch (error) {
      showMessage("Failed to reject booking.", true);
    }
  }

  // --- Logout ---
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "../index.html";
  });

  async function loadInitialData() {
    const [hostelsRes, bookingsRes] = await Promise.all([
      fetch(`${API_URL}/hostels`),
      fetch(`${API_URL}/bookings`)
    ]);
    hostels = await hostelsRes.json();
    bookings = await bookingsRes.json();
    renderMyHostels();
    renderBookings();
  }

  loadInitialData();
}
