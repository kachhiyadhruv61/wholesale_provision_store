import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminLoginPage() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
    setError(""); // Clear error when user types
  };

  const handleLogin = (e) => {
    e.preventDefault();
    
    if (credentials.username === "admin" && credentials.password === "admin123") {
      localStorage.setItem("adminLoggedIn", "true");
      navigate("/admin-dashboard");
    } else {
      setError("Invalid admin credentials. Please try again.");
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-form-center">
        <div className="login-form-wrapper">
          <div className="form-header">
            <h2>🔐 Admin Login</h2>
            <p>Access the admin dashboard</p>
          </div>

          {error && <div className="error-message">{error}</div>}

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
                required
              />
            </div>

            <button type="submit" className="btn-submit">
              Login as Admin
            </button>

            <div className="form-footer">
              <p>Not an admin? <a href="/login">User Login</a></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;
