// ✅ Check if admin is logged in
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser || currentUser.role !== "admin") {
  window.location.href = "../index.html";
}

// ✅ Display admin name
document.getElementById("adminName").textContent = currentUser.name;

// ✅ Get hostel data
let hostels = JSON.parse(localStorage.getItem("hostels")) || [];
const hostelList = document.getElementById("hostelList");

// --- Helper Functions (Replaces alert() and confirm()) ---

// Function to replace alert()
function showMessage(message) {
  const msgBox = document.createElement('div');
  msgBox.style.cssText = 'position:fixed;top:20px;right:20px;padding:15px;background:#333;color:white;border-radius:8px;z-index:10000;box-shadow:0 4px 8px rgba(0,0,0,0.2);';
  msgBox.textContent = message;
  document.body.appendChild(msgBox);
  setTimeout(() => msgBox.remove(), 3000);
}

// Function to replace confirm()
function showConfirmModal(message, onConfirm) {
  let modal = document.getElementById('customConfirmModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'customConfirmModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:2000;display:flex;justify-content:center;align-items:center;';
    modal.innerHTML = `
      <div style="background:white;padding:25px;border-radius:10px;box-shadow:0 5px 15px rgba(0,0,0,0.3);max-width:350px;">
        <p id="confirmMessage">${message}</p>
        <button id="confirmYes" class="approve" style="margin-right:10px;">Yes</button>
        <button id="confirmNo" class="delete" style="background:#ccc; color: #333;">No</button>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    document.getElementById('confirmMessage').textContent = message;
    modal.style.display = 'flex';
  }

  document.getElementById('confirmYes').onclick = () => {
    onConfirm();
    modal.style.display = 'none';
  };
  document.getElementById('confirmNo').onclick = () => {
    modal.style.display = 'none';
  };
}

// ✅ Render all hostels
function renderHostels() {
  hostelList.innerHTML = "";

  if (hostels.length === 0) {
    hostelList.innerHTML = `<tr><td colspan="6">No hostels uploaded yet.</td></tr>`;
    return;
  }

  hostels.forEach((hostel, index) => {
    const row = document.createElement("tr");

    // Ensure all hostels have an 'approved' status for consistency, defaulting to false if undefined.
    const isApproved = hostel.approved === true;

    row.innerHTML = `
      <td>${hostel.name}</td>
      <td>${hostel.location}</td>
      <td>${hostel.price}</td>
      <td>${hostel.landlord}</td>
      <td>${isApproved ? "✅ Yes" : "⏳ No"}</td>
      <td>
        ${
          isApproved
            ? `<button class="delete-btn" data-index="${index}">Delete</button>`
            : `<button class="approve-btn" data-index="${index}">Approve</button>
               <button class="delete-btn" data-index="${index}">Delete</button>`
        }
      </td>
    `;

    hostelList.appendChild(row);
  });

  // Attach event listeners dynamically
  document.querySelectorAll('.approve-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-index'));
      approveHostel(index);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-index'));
      // Using custom modal instead of confirm()
      showConfirmModal("Are you sure you want to delete this hostel?", () => {
          deleteHostel(index);
      });
    });
  });
}

// ✅ Approve hostel
function approveHostel(index) {
  // FIX: This flag is now used consistently by the student dashboard.
  hostels[index].approved = true; 
  localStorage.setItem("hostels", JSON.stringify(hostels));
  showMessage("✅ Hostel approved successfully! Students can now see it."); // Replaced alert()
  renderHostels();
}

// ✅ Delete hostel
function deleteHostel(index) {
  hostels.splice(index, 1);
  localStorage.setItem("hostels", JSON.stringify(hostels));
  renderHostels();
  showMessage("🗑️ Hostel deleted."); // Replaced @()
}

// ✅ Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "../index.html";
});

// ✅ Initial render
renderHostels();