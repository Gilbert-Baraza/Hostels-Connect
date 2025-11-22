// This script now uses the Node.js/MongoDB backend.

// --- Globals-----
const API_URL = "https://hostels-connect.onrender.com/api";
let currentUser = null;
let hostels = [];
let bookings = [];

// --- Toast ---
function showMessage(message, isError = false) {
  const msg = document.createElement("div");
  msg.style.cssText = `
    position:fixed;top:20px;right:20px;
    background:${isError ? "#dc3545" : "#333"};
    color:white;padding:12px 18px;border-radius:8px;z-index:9999;
    box-shadow:0 4px 8px rgba(0,0,0,0.3);
  `;
  msg.textContent = message;
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 4000);
}

// === Auth & Role Check ===
document.addEventListener("DOMContentLoaded", () => {
  currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser || currentUser.role !== "student") {
    showMessage("Access denied. Please log in as a student.", true);
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("studentName").textContent = currentUser.name || "Student";
  setupStudentDashboard();
});

document.addEventListener('DOMContentLoaded', function() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  const navLinks = document.querySelectorAll('.nav-link');

  sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('show');
  });

  // Close sidebar when clicking outside of it
  document.addEventListener('click', function(event) {
      const isClickInsideSidebar = sidebar.contains(event.target) || sidebarToggle.contains(event.target);
      if (!isClickInsideSidebar && sidebar.classList.contains('show')) {
          sidebar.classList.remove('show');
      }
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      sidebar.classList.remove('show');
    });
  });

});

// === SPA Navigation ===
function setupNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  const pages = document.querySelectorAll(".page");


  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetPage = link.dataset.page;

      pages.forEach(p => p.classList.remove("active"));
      document.getElementById(`page-${targetPage}`).classList.add("active");

      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
    });
  });
}


// === Dashboard Setup ===
async function setupStudentDashboard() {
  const hostelContainer = document.getElementById("hostelContainer");
  const bookingsContainer = document.getElementById("bookingsContainer");
  const contactMessageBox = document.getElementById("contactMessageBox");
  const modal = document.getElementById("hostelModal");
  const searchInput = document.getElementById("searchInput");
  const sortFilter = document.getElementById("sortFilter");
  const locationFilter = document.getElementById("locationFilter");
  const logoutBtn = document.getElementById("logoutBtn");

  // --- Logout ---
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "../login.html";
    });
  }

  // --- Modal ---
  function closeModal() {
    modal.style.display = "none";
  }
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // --- Render Hostels ---
  function renderHostels(filteredHostels) {
    // No need for a check now, it's always present
    hostelContainer.innerHTML = ""; // Clear previous results
    

    if (filteredHostels.length === 0) {

      hostelContainer.innerHTML = "<p>No approved hostels available.</p>";
      return;
    }

    filteredHostels.forEach((h) => {
      const card = document.createElement("div");
      card.className = `hostel-card ${h.roomsAvailable <= 0 ? 'booked' : ''}`;
      // Use the premium card structure from style.css
      card.innerHTML = `
      
        <div class="price-badge">Ksh ${h.price}/${h.paymentFrequency === 'semester' ? 'sem' : 'mo'}</div>
        <img src="${h.imageUrl || 'default-hostel-image.jpg'}" alt="${h.name}" onerror="this.onerror=null;this.src='default-hostel-image.jpg';">
        <div class="hostel-info">
          <h4>${h.name}</h4>
          <div class="location">
            <i class="fa-solid fa-map-marker-alt"></i>
            <span>${h.location}</span>
          </div>
           <p><strong>Room Type:</strong> ${h.roomType}</p>          
          </div>
          <div class="price">
            ${h.roomsAvailable > 0 ? `${h.roomsAvailable} Rooms Available` : 'Fully Booked'}

          </div>
        </div>
      `;
      // The entire card is now clickable

      if (h.roomsAvailable > 0) {
        card.addEventListener("click", () => openModal(h));
      }
      hostelContainer.appendChild(card);
    });
  }

  // --- Render Bookings ---
  async function renderBookings() {
    // No need for a check now
    bookingsContainer.innerHTML = "";
    contactMessageBox.style.display = "none";
    const landlordContactSpan = document.getElementById("landlordContact");

    const myBookings = bookings.filter((b) => b.studentId === currentUser.id);
    if (myBookings.length === 0) {
      bookingsContainer.innerHTML = "<p>You have no current bookings.</p>";
      return;
    }
    
    for (const b of myBookings) {
      const card = document.createElement("div");
      card.className = "booking-card";
      let statusLabel = `<span class="status-${b.status}">${b.status}</span>`;

      // If booking approved
      if (b.status === "approved") {
        const landlordUser = await fetchLandlordDetails(b.landlordId);
        contactMessageBox.style.display = "block";
        if (landlordUser && landlordContactSpan) {
            landlordContactSpan.innerHTML = `<a href="tel:${landlordUser.phone}">${landlordUser.phone}</a> (${landlordUser.name})`;
        } else {
            landlordContactSpan.textContent = "Not available";
        }
        statusLabel = `<span class="approved">Approved</span>`;
      }

      card.innerHTML = `
        <h4>${b.hostelName}</h4>
        <p><strong>Landlord:</strong> ${b.landlord}</p>
        <p><strong>Status:</strong> ${statusLabel}</p>
        <small>Booked on: ${new Date(b.createdAt).toLocaleDateString()}</small><br>
        ${
          b.status === "pending" || b.status === "approved"
            ? `<button class="cancel-btn" data-id="${b._id}">Cancel Booking</button>`
            : `<button class="remove-btn" data-id="${b._id}">Remove</button>`
        }
      `;
      bookingsContainer.appendChild(card);
    }

    // Cancel or Remove event listeners
    document.querySelectorAll(".cancel-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => cancelBooking(e.target.dataset.id))
    );

    document.querySelectorAll(".remove-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => removeBooking(e.target.dataset.id))
    );
  }

  // --- Fetch Landlord Details ---
  async function fetchLandlordDetails(landlordId) {
    if (!landlordId) return null;
    try {
      const response = await fetch(`${API_URL}/users/${landlordId}`);
      if (!response.ok) throw new Error('Could not fetch landlord details');
      return await response.json();
    } catch (error) {
      console.error("Fetch landlord error:", error);
      return null;
    }
  }

  // --- Cancel Booking ---
  async function cancelBooking(bookingId) {
    // This uses the special cancel route that also increments the hostel room count
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to cancel');

      showMessage("❌ Booking cancelled. You can now book another hostel.");
      loadInitialData();
    } catch (error) {
      console.error("Cancel error:", error);
      showMessage("Error cancelling booking.", true);
    }
  }

  // --- Remove Booking ---
  async function removeBooking(bookingId) {
    try {
      await fetch(`${API_URL}/bookings/${bookingId}`, { method: 'DELETE' });
      showMessage("🗑️ Booking removed from your dashboard.");
      loadInitialData();
    } catch (error) {
      console.error("Remove error:", error);
      showMessage("Failed to remove booking.", true);
    }
  }
  
  // --- Book Hostel ---
  async function bookHostel(hostel) {
    try {
      const activeBooking = bookings.find(
        (b) => b.studentId === currentUser.id && (b.status === "pending" || b.status === "approved")
      );

      if (activeBooking) {
        showMessage("⚠️ You already have an active booking.");
        return;
      }

      const bookingData = {
        hostelId: hostel._id,
        hostelName: hostel.name,
        landlord: hostel.landlord || "Unknown",
        landlordId: hostel.landlordId || null,
        student: currentUser.name,
        studentId: currentUser.id,
        status: "pending",
      };

      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        
        body: JSON.stringify(bookingData)
      });
      if (!response.ok) throw new Error('Booking failed');
      showMessage("✅ Booking request sent. Await approval.");
      closeModal();
      loadInitialData();
    } catch (error) {
      console.error("Booking error:", error);
      showMessage("Error booking hostel.", true);
    }
  }

  // --- Modal ---
  function openModal(hostel) {
    const modalContent = document.getElementById("modalContent");
    modal.style.display = "block";
    modalContent.innerHTML = `
      <span class="close">&times;</span>
      <h3>${hostel.name}</h3>
      <p><strong>Price:</strong> Ksh ${hostel.price}</p>
      <p><strong>Payment Frequency:</strong> ${hostel.paymentFrequency}</p>
       <p><strong>Room Type:</strong> ${hostel.roomType}</p>
      <p><strong>Location:</strong> <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hostel.location)}" target="_blank" style="color: #667eea; text-decoration: underline;">${hostel.location}</a></p>
      <p><strong>Rules and Regulations:</strong> ${hostel.rulesAndRegulations || "N/A"}</p>
      <p><strong>Landlord:</strong> ${hostel.landlord || "Unknown"}</p>
      <button id="bookBtn" ${hostel.roomsAvailable <= 0 ? "disabled" : ""}>
        ${hostel.roomsAvailable <= 0 ? "Fully Booked" : "Book Hostel"}
      </button>
    `;
    modalContent.querySelector(".close").addEventListener("click", closeModal);
    const bookBtn = modalContent.querySelector("#bookBtn");
    if (hostel.roomsAvailable > 0) {
      bookBtn.addEventListener("click", () => bookHostel(hostel));
    }
  }

  // --- Filters & Sorting ---
  function applyFilters() {
    // No need for a check now
    let filtered = hostels.filter((h) => h.approved === true);
    const search = searchInput.value.toLowerCase();
    const loc = locationFilter.value.toLowerCase();
    const sort = sortFilter.value;
    if (search) filtered = filtered.filter((h) => h.name.toLowerCase().includes(search));
    if (loc) filtered = filtered.filter((h) => h.location.toLowerCase().includes(loc));
    if (sort === "priceLowHigh") filtered.sort((a, b) => a.price - b.price);
    else if (sort === "priceHighLow") filtered.sort((a, b) => b.price - a.price);
    renderHostels(filtered);
  }

  searchInput.addEventListener('input', applyFilters);
  locationFilter.addEventListener('change', applyFilters);
  sortFilter.addEventListener('change', applyFilters);

  // --- Initial Data Load ---
  async function loadInitialData() {
    const [hostelsRes, bookingsRes] = await Promise.all([
      fetch(`${API_URL}/hostels`),
      fetch(`${API_URL}/bookings`)
    ]);
    hostels = await hostelsRes.json();
    bookings = await bookingsRes.json();
    applyFilters();
    await renderBookings();
  }

  loadInitialData();
  setupNavigation(); // Set up the page-switching logic
}

// Dark mode toggle
document.addEventListener('DOMContentLoaded', function() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const body = document.body;

  // Load saved preference
  const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
  if (isDarkMode) {
      body.classList.add('dark-mode');
      darkModeToggle.checked = true;
  }

  darkModeToggle.addEventListener('change', function() {
      body.classList.toggle('dark-mode');
      localStorage.setItem('darkMode', this.checked ? 'enabled' : 'disabled');
  });
});
