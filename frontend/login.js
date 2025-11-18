// This script now uses the Node.js/MongoDB backend for authentication.

const API_URL = "https://hostels-connect.onrender.com/api";

// --- UI Message Helper ---
function showMessage(message, isError = false) {
  const msgBox = document.createElement('div');
  msgBox.style.cssText = `
    position:fixed;top:20px;right:20px;
    padding:15px;background:${isError ? '#f44336' : '#333'};
    color:white;border-radius:8px;z-index:10000;
    box-shadow:0 4px 8px rgba(0,0,0,0.2);
  `;
  msgBox.textContent = message;
  document.body.appendChild(msgBox);
  setTimeout(() => msgBox.remove(), 4000);
}

// --- Login Logic ---
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  if (!form) {
    console.error("Login form not found!");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("username").value.trim();
    const password = passwordInput.value.trim();
    const loginButton = form.querySelector('button[type="submit"]');

    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';

    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Invalid credentials');
      }

      // Store user info and token for session management
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);

      // Redirect based on role
      switch (data.user.role) {
        case "student":
          window.location.href = "student/index.html";
          break;
        case "landlord":
          window.location.href = "landlord/index.html";
          break;
        case "admin":
          window.location.href = "admin/index.html";
          break;
        default:
          showMessage("Login successful, but role is unknown.", true);
      }
    } catch (error) {
      showMessage(error.message, true);
    } finally {
      loginButton.disabled = false;
      loginButton.innerHTML = '<strong>Login</strong>';
    }
  });

  // --- Toggle password visibility ---
  togglePassword.addEventListener("click", () => {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    togglePassword.textContent = type === "password" ? "👁️" : "🙈";
  });
});