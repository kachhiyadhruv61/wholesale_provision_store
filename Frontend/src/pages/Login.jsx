import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../context/UserContext";

function Login() {
  const navigate = useNavigate();
  const { loginUser } = useContext(UserContext);
  const [credentials, setCredentials] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Automatically detect admin login
    if (credentials.username === "admin" && credentials.password === "admin123") {
      localStorage.setItem("adminLoggedIn", "true");
      navigate("/admin-dashboard");
    } else if (credentials.username && credentials.email) {
      // Regular user login
      loginUser(credentials.username, credentials.email);
      navigate("/products");
    } else {
      alert("Please fill in all required fields");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-visual-content">
            <div className="auth-illustration">
              <div className="illustration-circle circle-1"></div>
              <div className="illustration-circle circle-2"></div>
              <div className="illustration-circle circle-3"></div>
              <div className="main-illustration">
                <div className="shop-building">
                  <div className="building-roof">🏪</div>
                  <div className="building-windows">
                    <span>💼</span>
                    <span>📦</span>
                    <span>🛍️</span>
                  </div>
                </div>
                <div className="floating-elements">
                  <span className="float-icon icon-1">💰</span>
                  <span className="float-icon icon-2">📊</span>
                  <span className="float-icon icon-3">🚚</span>
                  <span className="float-icon icon-4">✨</span>
                </div>
              </div>
            </div>
            
            <div className="auth-branding">
              <h1>Welcome to DK TRADERS!</h1>
              <p>Your trusted wholesale partner for quality products and seamless business solutions</p>
            </div>
            
            <div className="auth-features">
              <div className="feature-item">
                <span className="feature-icon">💎</span>
                <div className="feature-content">
                  <strong>Premium Quality</strong>
                  <span>Best wholesale prices guaranteed</span>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <div className="feature-content">
                  <strong>Fast Delivery</strong>
                  <span>Quick and reliable shipping</span>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <div className="feature-content">
                  <strong>Easy Management</strong>
                  <span>Track orders in real-time</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-wrapper">
            <div className="form-header">
              <h2>Login</h2>
              <p>Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleLogin} className="auth-form">
              <div className="input-group">
                <label htmlFor="username">
                  <span className="label-icon">👤</span>
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={credentials.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="email">
                  <span className="label-icon">📧</span>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="your@email.com (not required for admin)"
                  value={credentials.email}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">
                  <span className="label-icon">🔒</span>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter your password (optional for users)"
                  value={credentials.password}
                  onChange={handleChange}
                />
                <small className="input-hint">Admin login: username "admin" with password "admin123"</small>
              </div>

              <button type="submit" className="auth-submit-btn">
                <span>Login</span>
                <span className="btn-arrow">→</span>
              </button>
              
              <div className="login-info-box">
                <p className="info-text">
                  💡 <strong>Tip:</strong> System automatically detects admin login
                </p>
              </div>
            </form>

            <div className="auth-footer">
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="auth-link">
                  Register Now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
