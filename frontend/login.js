document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("form");
  const emailInput = document.getElementById("username"); // The input field for email
  const passwordInput = document.getElementById("password");
  const errorMessageElement = document.getElementById("loginErrorMessage");
  const togglePassword = document.getElementById("togglePassword");
  const loginButton = document.getElementById("loginButton"); // Ensure your button has id="loginButton"

  const API_URL = "http://localhost:5000/api";

  // --- Password Visibility Toggle ---
  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      togglePassword.textContent = type === "password" ? "👁️" : "🙈";
    });
  }

  // --- Form Submission Logic ---
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Reset previous errors
    emailInput.classList.remove("input-error");
    passwordInput.classList.remove("input-error");
    errorMessageElement.style.display = "none";
    errorMessageElement.textContent = "";

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // This block runs for 4xx/5xx errors, like "Invalid credentials"
        throw new Error(data.msg || "An error occurred during login.");
      }

      // --- On Successful Login ---
      // Store user data and token in localStorage
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      // Redirect based on user role
      if (data.user.role === "student") {
        window.location.href = "./student/index.html";
      } else if (data.user.role === "landlord") {
        window.location.href = "./landlord/index.html";
      } else {
        // Default redirect if role is not student or landlord
        console.warn("Logged in with an unhandled role:", data.user.role);
        window.location.href = "/"; // Redirect to the main landing page
      }

    } catch (error) {
      // --- On Failed Login ---
      // Display the error message from the backend (e.g., "Invalid credentials")
      errorMessageElement.textContent = error.message;
      errorMessageElement.style.display = "block";

      // Add the red border to the input fields
      emailInput.classList.add("input-error");
      passwordInput.classList.add("input-error");
    }
  });
});