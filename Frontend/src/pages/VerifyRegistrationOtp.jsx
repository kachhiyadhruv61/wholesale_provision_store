import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiClient } from "../utils/apiClient";

function VerifyRegistrationOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  const prefilledEmail = String(location.state?.email || "").trim();
  const fullname = String(location.state?.fullname || "").trim();

  const [formData, setFormData] = useState({
    email: prefilledEmail,
    otp: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [status, setStatus] = useState({
    kind: "",
    text: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: name === "otp" ? value.replace(/\D/g, "").slice(0, 6) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = String(formData.email || "").trim();
    const otp = String(formData.otp || "").trim();

    if (!email || !otp) {
      setStatus({ kind: "error", text: "Please enter email and OTP." });
      return;
    }

    try {
      setSubmitting(true);
      setStatus({ kind: "", text: "" });

      try {
        await apiClient.post("/registers/verify-otp", {
          email,
          otp,
        });
      } catch (directError) {
        if (!String(directError?.message || "").includes("404")) {
          throw directError;
        }

        await apiClient.post("/api/registers/verify-otp", {
          email,
          otp,
        });
      }

      setStatus({
        kind: "success",
        text: "OTP verified successfully. Your account is active now.",
      });

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1100);
    } catch (error) {
      setStatus({ kind: "error", text: error.message || "OTP verification failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    const email = String(formData.email || "").trim();
    if (!email) {
      setStatus({ kind: "error", text: "Please enter your email first." });
      return;
    }

    try {
      setResending(true);
      setStatus({ kind: "", text: "" });

      try {
        await apiClient.post("/registers/resend-otp", { email });
      } catch (directError) {
        if (!String(directError?.message || "").includes("404")) {
          throw directError;
        }
        await apiClient.post("/api/registers/resend-otp", { email });
      }

      setStatus({ kind: "success", text: "New OTP sent to your email." });
    } catch (error) {
      setStatus({ kind: "error", text: error.message || "Unable to resend OTP." });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="otp-verify-page">
      <div className="otp-verify-shell">
        <aside className="otp-verify-aside">
          <div className="otp-chip">Email Verification</div>
          <h1>One Final Step</h1>
          <p>
            {fullname ? `Hi ${fullname}, ` : ""}
            we sent an OTP to your email. Verify it to activate your customer account.
          </p>
          <ul>
            <li>OTP valid for 5 minutes</li>
            <li>Account becomes active after verification</li>
            <li>Then you can login and place orders</li>
          </ul>
        </aside>

        <section className="otp-verify-card">
          <div className="otp-title-wrap">
            <h2>Verify Registration OTP</h2>
            <p>Enter your email and OTP code</p>
          </div>

          <form className="otp-verify-form" onSubmit={handleSubmit}>
            <label htmlFor="verify-email">Email Address</label>
            <input
              id="verify-email"
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="verify-otp">OTP Code</label>
            <input
              id="verify-otp"
              type="text"
              name="otp"
              placeholder="Enter OTP"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={formData.otp}
              onChange={handleChange}
              required
            />

            {status.text ? (
              <p className={`otp-verify-message ${status.kind === "success" ? "otp-verify-success" : "otp-verify-error"}`}>
                {status.text}
              </p>
            ) : null}

            <button type="submit" className="otp-verify-btn-submit" disabled={submitting}>
              {submitting ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              className="otp-verify-btn-resend"
              onClick={handleResendOtp}
              disabled={resending}
            >
              {resending ? "Sending..." : "Resend OTP"}
            </button>
          </form>

          <div className="otp-verify-footer">
            <p>
              Already verified? <Link to="/login">Go to Login</Link>
            </p>
            <p>
              Need new OTP? <Link to="/register">Register again</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default VerifyRegistrationOtp;
