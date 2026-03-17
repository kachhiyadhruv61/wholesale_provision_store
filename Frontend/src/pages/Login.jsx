import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";

function Login() {

  const navigate = useNavigate();
  const { setAuthenticatedUser } = useContext(UserContext);

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const API_URL = "http://localhost:5000/login"; 

  const handleChange = (e) => {
    const { name, value } = e.target;

    setCredentials({
      ...credentials,
      [name]: value,
    });
  };

  // LOGIN API CALL
  const handleLogin = async (e) => {

    e.preventDefault();

    if (!credentials.username || !credentials.password) {
      alert("Please fill all fields");
      return;
    }

    try {

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      // SAVE TOKENS
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      setAuthenticatedUser(data.user || {});

      if (data.user.role === "admin") {
        localStorage.setItem("adminLoggedIn", "true");
        // localStorage.setItem("adminUsername", credentials.username);
        navigate("/admin-home");
      } else {
        navigate("/products");
      }

    } catch (error) {

      console.error("Login Error:", error);
      alert("Server error");
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

            {/* USERNAME */}

            <div className="form-group">

              <label>Username</label>

              <input
                type="text"
                name="username"
                placeholder="Enter username"
                value={credentials.username}
                onChange={handleChange}
                required
              />

            </div>

            {/* PASSWORD */}

            <div className="form-group">

              <label>Password</label>

              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={credentials.password}
                onChange={handleChange}
                required
              />

            </div>

            <div className="form-helper">

              <Link to="/forgot-password">
                Forgot password?
              </Link>

            </div>

            <button type="submit" className="login-submit-btn">
              Login →
            </button>

          </form>

          <div className="login-footer">

            <p>
              Don't have an account?{" "}
              <Link to="/register">
                Register
              </Link>
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;