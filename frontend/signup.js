// This script now uses the Node.js/MongoDB backend for registration.

const API_URL = "http://localhost:5000/api";

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
  setTimeout(() => msgBox.remove(), 5000);
}

// --- Password Strength Validation ---
function validatePasswordStrength(password) {
  const minLength = /.{8,}/;
  const hasUpper = /[A-Z]/;
  const hasLower = /[a-z]/;
  const hasNumber = /\d/;
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/;

  if (!minLength.test(password)) return "Password must be at least 8 characters long.";
  if (!hasUpper.test(password)) return "Include at least one uppercase letter.";
  if (!hasLower.test(password)) return "Include at least one lowercase letter.";
  if (!hasNumber.test(password)) return "Include at least one number.";
  if (!hasSpecial.test(password)) return "Include at least one special character (@, #, $, etc.).";
  return null;
}

// --- Signup Logic ---
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");

  if (!signupForm) {
    console.error("Signup form not found!");
    return;
  }

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    const role = document.getElementById("role").value;
    const signupButton = signupForm.querySelector('button[type="submit"]');

    // --- Validation ---
    if (!name || !email || !phone || !password || !role) {
      showMessage("Please fill in all fields!", true);
      return;
    }
    if (password !== confirmPassword) {
      showMessage("Passwords do not match!", true);
      return;
    }
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      showMessage(passwordError, true);
      return;
    }

    signupButton.disabled = true;
    signupButton.textContent = 'Registering...';

    // --- Validation ---
    if (!phone) {
      showMessage("Please provide a phone number!", true);
      signupButton.disabled = false;
      signupButton.textContent = 'Sign Up';
      return;
    }
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Something went wrong');
      }

      showMessage("Account created successfully! Redirecting to login...");
      setTimeout(() => { window.location.href = "login.html"; }, 2000);

    } catch (error) {
      console.error("Signup Error:", error);
      showMessage(error.message, true);
    } finally {
      signupButton.disabled = false;
      signupButton.textContent = 'Sign Up';
    }
  });
});