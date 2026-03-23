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
  const [otpCode, setOtpCode] = useState("");
  const [otpMeta, setOtpMeta] = useState({
    sent: false,
    verified: false,
    code: "",
    message: "",
    error: "",
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const resetOtpState = () => {
    setOtpCode("");
    setOtpMeta({ sent: false, verified: false, code: "", message: "", error: "" });
  };

  const isEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setMessage("");
    setIsError(false);

    if (name === "identifier" && (otpMeta.sent || otpMeta.verified)) {
      resetOtpState();
    }
  };

  const handleSendOtp = () => {
    const identifier = formData.identifier.trim();
    if (!identifier || !isEmail(identifier)) {
      setOtpMeta({ sent: false, verified: false, code: "", message: "", error: "Please enter a valid email to receive OTP." });
      return;
    }

    const generatedOtp = `${Math.floor(100000 + Math.random() * 900000)}`;
    setOtpMeta({
      sent: true,
      verified: false,
      code: generatedOtp,
      message: `OTP sent to ${identifier}.`,
      error: "",
    });
    setOtpCode("");
    console.info("[Forgot Password OTP] Demo OTP:", generatedOtp);
    alert(`Demo OTP: ${generatedOtp}`);
  };

  const handleVerifyOtp = () => {
    if (!otpMeta.sent) {
      setOtpMeta({ ...otpMeta, error: "Please request OTP first." });
      return;
    }

    if (otpCode.trim() === otpMeta.code) {
      setOtpMeta({ ...otpMeta, verified: true, error: "", message: "Email verified." });
      return;
    }

    setOtpMeta({ ...otpMeta, error: "Invalid OTP. Please try again." });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otpMeta.sent) {
      handleSendOtp();
      return;
    }

    if (!otpMeta.verified) {
      setOtpMeta({ ...otpMeta, error: "Please verify OTP to continue." });
      return;
    }

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

    const result = await resetPassword(formData.identifier.trim(), formData.newPassword);
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

            <div className="form-group otp-group">
              <div className="otp-header">
                <label>
                  <span className="label-icon"></span>
                  Email OTP
                </label>
                <button
                  type="button"
                  className="otp-action-btn"
                  onClick={handleSendOtp}
                >
                  {otpMeta.sent ? "Resend OTP" : "Send OTP"}
                </button>
              </div>

              <div className="otp-row">
                <input
                  type="text"
                  name="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  disabled={!otpMeta.sent}
                />
                <button
                  type="button"
                  className="otp-verify-btn"
                  onClick={handleVerifyOtp}
                  disabled={!otpMeta.sent || otpMeta.verified}
                >
                  {otpMeta.verified ? "Verified" : "Verify"}
                </button>
              </div>

              {otpMeta.message && <p className="otp-status">{otpMeta.message}</p>}
              {otpMeta.error && <p className="otp-error">{otpMeta.error}</p>}
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
