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

// abcd

        //  hello ji                                      

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
    <div className="login-page-container">
      <div className="login-form-center">
        <div className="login-form-wrapper">
          <div className="form-header">
            <h1>Login</h1>
            <p>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>
                <span className="label-icon"></span>
                Username
              </label>
              <input
                type="text"
                name="username"
                placeholder="Enter your username"
                value={credentials.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon"></span>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="your@email.com (not required for admin)"
                value={credentials.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon"></span>
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={handleChange}
                required
              />
              <small className="input-hint">
                 Admin: username "admin" with password "admin123"
              </small>
            </div>

            <div className="form-helper">
              <Link to="/forgot-password" className="auth-link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="login-submit-btn">
              <span>Login</span>
              <span className="btn-arrow">→</span>
            </button>
          </form>

          <div className="login-footer">
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
  );
}

export default Login;
