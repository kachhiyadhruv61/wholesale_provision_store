import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

function ForgotPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useContext(UserContext);
  const [formData, setFormData] = useState({
    identifier: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setMessage("");
    setIsError(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.newPassword.length < 6) {
      setIsError(true);
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match.");
      return;
    }

    const result = resetPassword(formData.identifier.trim(), formData.newPassword);
    if (!result.success) {
      setIsError(true);
      setMessage(result.message || "Unable to reset password.");
      return;
    }

    setIsError(false);
    setMessage("Password reset successful. Please login.");
    setTimeout(() => navigate("/login"), 800);
  };

  return (
    <div className="login-page-container">
      <div className="login-form-center">
        <div className="login-form-wrapper">
          <div className="form-header">
            <h1>Forgot Password</h1>
            <p>Reset your password with your username or email</p>
          </div>

          {message && (
            <div className={`message ${isError ? "error-message" : "success-message"}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>
                <span className="label-icon"></span>
                Username or Email
              </label>
              <input
                type="text"
                name="identifier"
                placeholder="Enter username or email"
                value={formData.identifier}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon"></span>
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon"></span>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="login-submit-btn">
              <span>Reset Password</span>
              <span className="btn-arrow">→</span>
            </button>
          </form>

          <div className="login-footer">
            <p>
              Remembered your password?{" "}
              <Link to="/login" className="auth-link">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
