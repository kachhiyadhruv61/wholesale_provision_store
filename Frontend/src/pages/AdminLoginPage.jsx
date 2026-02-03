import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminLoginPage() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
    setError(""); // Clear error when user types
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate a small delay for better UX
    setTimeout(() => {
      if (credentials.username.trim() === "" || credentials.password.trim() === "") {
        setError("Please fill in all fields.");
        setLoading(false);
        return;
      }

      if (credentials.username === "admin" && credentials.password === "admin123") {
        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("adminUsername", credentials.username);
        setLoading(false);
        navigate("/admin-analytics");
      } else {
        setError("Invalid admin credentials. Please try again.");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="login-page-container">
      <div className="login-form-center">
        <div className="login-form-wrapper">
          <div className="form-header">
            <h2>🔐 Admin Login</h2>
            <p>Access the admin analytics dashboard</p>
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">👤 Username</label>
              <input
                id="username"
                type="text"
                name="username"
                placeholder="Enter admin username"
                value={credentials.username}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">🔒 Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter admin password"
                value={credentials.password}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login as Admin"}
            </button>

            <div className="form-footer">
              <p>Not an admin? <a href="/login">User Login</a></p>
            </div>
          </form>

          <div className="login-info-box">
            <p className="info-text">
              <strong>Demo Credentials:</strong><br />
              Username: <strong>admin</strong><br />
              Password: <strong>admin123</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;
