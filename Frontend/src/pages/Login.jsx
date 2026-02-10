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
  const [otpCode, setOtpCode] = useState("");
  const [otpMeta, setOtpMeta] = useState({
    sent: false,
    verified: false,
    code: "",
    message: "",
    error: "",
  });

// abcd

        //  hello ji                                      

  const resetOtpState = () => {
    setOtpCode("");
    setOtpMeta({ sent: false, verified: false, code: "", message: "", error: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target; 
    setCredentials({ ...credentials, [name]: value });

    if (name === "email" && (otpMeta.sent || otpMeta.verified)) {
      resetOtpState();
    }
  };

  const handleSendOtp = () => {
    if (!credentials.email) {
      setOtpMeta({ sent: false, verified: false, code: "", message: "", error: "Email is required for OTP." });
      return;
    }

    const generatedOtp = `${Math.floor(100000 + Math.random() * 900000)}`;
    setOtpMeta({
      sent: true,
      verified: false,
      code: generatedOtp,
      message: `OTP sent to ${credentials.email}.`,
      error: "",
    });
    setOtpCode("");
    console.info("[Login OTP] Demo OTP:", generatedOtp);
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

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Automatically detect admin login
    if (credentials.username === "admin" && credentials.password === "admin123") {
      localStorage.setItem("adminLoggedIn", "true");
      localStorage.setItem("adminUsername", "admin");
      navigate("/admin-home");
    } else if (credentials.username && credentials.email && credentials.password) {
      if (!otpMeta.sent) {
        handleSendOtp();
        return;
      }

      if (!otpMeta.verified) {
        setOtpMeta({ ...otpMeta, error: "Please verify OTP to continue." });
        return;
      }

      // Regular user login (after OTP verification)
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

            {credentials.email && credentials.username !== "admin" && (
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
            )}

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
